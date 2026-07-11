const { ROLES, esColaboradorMinisterio } = require('../middleware/auth');
const { getById, updateInCollection } = require('./firestore');
const {
  notificarResolucionMovimientoLider,
  notificarMovimientoModificado,
  notificarMovimientoEliminado,
  notificarMovimientoCreado
} = require('./notificacion-movimiento');
const { stampActualizacion, resolveActor } = require('./auditoria');
const { assertPeriodoAbierto, assertMovimientoModificable } = require('./cierre');
const { assertMinisterioPermiteIngresoManual } = require('./ministerio-iglesia');
const {
  generarAportacionIglesiaPorIngreso,
  revertirAportacionIglesiaPorIngreso,
  bloquearEdicionAportacionIglesia,
  actualizarAportacionIglesiaPorIngreso,
  calcularMontoAportacionIglesia
} = require('./aportacion-iglesia');
const { ingresoEsTalento } = require('../constants/aportacion-iglesia');

const COLLECTION = 'ingresos';
const ESTADOS = new Set(['pendiente', 'aprobado', 'rechazado']);

/** @param {unknown} estado @returns {import('../types/firestore.types').MovimientoEstado} */
function normalizarEstado(estado) {
  if (!estado) return 'aprobado';
  return ESTADOS.has(estado) ? estado : 'aprobado';
}

function estadoInicialPorRol(rol): import('../types/firestore.types').MovimientoEstado {
  if (esColaboradorMinisterio(rol)) return 'pendiente';
  if (rol === ROLES.ADMIN) return 'aprobado';
  return 'pendiente';
}

function onCreateIngreso(body, req) {
  /** @type {import('../types/firestore.types').MovimientoEstado} */
  const estado = estadoInicialPorRol(req.user?.rol);
  return {
    ...body,
    estado,
    motivoRechazo: estado === 'rechazado' ? body.motivoRechazo : null
  };
}

function onUpdateIngreso(body, req, current) {
  const rol = req.user?.rol;
  if (esColaboradorMinisterio(rol)) {
    const estadoActual = normalizarEstado(current?.estado);
    if (estadoActual === 'aprobado') {
      const err = new Error('No puedes modificar un ingreso ya aprobado');
      err.status = 403;
      throw err;
    }
    return {
      ...body,
      estado: 'pendiente',
      motivoRechazo: null
    };
  }
  if (rol === ROLES.CONTABLE) {
    const err = new Error('El contable solo puede consultar ingresos');
    err.status = 403;
    throw err;
  }
  const merged = { ...current, ...body };
  if (merged?.aportacionGenerada && ingresoEsTalento(merged)) {
    const monto = Number(body.monto ?? current?.monto);
    if (Number.isFinite(monto) && monto > 0) {
      const montoAportacionIglesia = calcularMontoAportacionIglesia(monto);
      return {
        ...body,
        montoAportacionIglesia,
        montoNetoMinisterio: Math.round((monto - montoAportacionIglesia) * 100) / 100
      };
    }
  }
  return body;
}

async function assertIngresoModificable(req, entity) {
  const bloqueoAportacion = bloquearEdicionAportacionIglesia(entity);
  if (bloqueoAportacion) return bloqueoAportacion;

  try {
    await assertMovimientoModificable(entity);
  } catch (err) {
    return { ok: false, message: err.message };
  }
  if (req.user?.rol === ROLES.CONTABLE) {
    return { ok: false, message: 'El contable solo puede consultar ingresos' };
  }
  if (esColaboradorMinisterio(req.user?.rol) && normalizarEstado(entity?.estado) === 'aprobado') {
    return { ok: false, message: 'No puedes modificar un ingreso ya aprobado' };
  }
  return { ok: true };
}

async function beforeCreateIngreso(body, req) {
  if (req?.user?.rol === ROLES.CONTABLE) {
    const err = new Error('El contable solo puede consultar ingresos');
    err.status = 403;
    throw err;
  }
  await assertPeriodoAbierto(body?.fecha);
  await assertMinisterioPermiteIngresoManual(body);
}

async function beforeUpdateIngreso(body, _req, current) {
  await assertMovimientoModificable(current);
  if (body?.fecha) await assertPeriodoAbierto(body.fecha);
  if (!current?.esAportacionIglesia) {
    await assertMinisterioPermiteIngresoManual({ ...current, ...body });
  }
}

async function notificarIngresoCreado(created, req) {
  return notificarMovimientoCreado({ tipo: 'ingreso', movimiento: created, req });
}

async function aprobarIngreso(id, req) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;

  await assertMovimientoModificable(current);

  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN) {
    const err = new Error('Solo el administrador puede aprobar ingresos');
    err.status = 403;
    throw err;
  }

  if (normalizarEstado(current.estado) === 'aprobado') {
    return current;
  }

  if (normalizarEstado(current.estado) === 'rechazado') {
    const err = new Error('No se puede aprobar un ingreso rechazado');
    err.status = 400;
    throw err;
  }

  const { db } = require('../config/firebase');
  const ref = db.collection(COLLECTION).doc(String(id));
  const actor = await resolveActor(req);
  const stamp = stampActualizacion(
    {
      estado: 'aprobado',
      motivoRechazo: null,
      aprobadoPor: req.user.sub,
      fechaAprobacion: new Date().toISOString()
    },
    actor,
    current
  );

  // Claim atómico: solo un approve concurrente pasa de pendiente → aprobado
  let claimed = false;
  if (typeof db.runTransaction === 'function') {
    claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return false;
      const data = snap.data() || {};
      if (normalizarEstado(data.estado) === 'aprobado') return false;
      if (normalizarEstado(data.estado) === 'rechazado') return false;
      tx.set(ref, stamp, { merge: true });
      return true;
    });
  } else {
    claimed = true;
    await updateInCollection(COLLECTION, id, stamp);
  }

  if (!claimed) {
    const latest = await getById(COLLECTION, id);
    return latest;
  }

  const updated = await getById(COLLECTION, id);

  await notificarResolucionMovimientoLider({
    tipo: 'ingreso',
    estado: 'aprobado',
    movimiento: current,
    req
  });

  return generarAportacionIglesiaPorIngreso(updated, req);
}

async function afterCreateIngreso(created, req) {
  try {
    await notificarIngresoCreado(created, req);
  } catch (notifErr) {
    console.error('[ingresos afterCreate notificación]', notifErr);
  }
  // Fallos de aportación 33 % no se silencian: el cliente debe enterarse
  return generarAportacionIglesiaPorIngreso(created, req);
}

async function rechazarIngreso(id, req, motivo) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;

  await assertMovimientoModificable(current);

  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN) {
    const err = new Error('Solo el administrador puede rechazar ingresos');
    err.status = 403;
    throw err;
  }

  if (normalizarEstado(current.estado) === 'rechazado') {
    return current;
  }

  const wasApproved = normalizarEstado(current.estado) === 'aprobado';
  const actor = await resolveActor(req);
  const motivoTxt = motivo ? String(motivo).trim() : 'Sin motivo indicado';

  // Si estaba aprobado (o tenía aportación), revertir el 33 % antes de marcar rechazo
  if (wasApproved || current.aportacionGenerada || current.ingresoIglesiaId) {
    await revertirAportacionIglesiaPorIngreso(current);
  }

  const updated = await updateInCollection(
    COLLECTION,
    id,
    stampActualizacion(
      {
        estado: 'rechazado',
        motivoRechazo: motivoTxt,
        rechazadoPor: req.user.sub,
        fechaRechazo: new Date().toISOString(),
        aportacionGenerada: false,
        ingresoIglesiaId: null,
        montoAportacionIglesia: null,
        montoNetoMinisterio: null
      },
      actor,
      current
    )
  );

  await notificarResolucionMovimientoLider({
    tipo: 'ingreso',
    estado: 'rechazado',
    movimiento: current,
    motivo: motivoTxt,
    req
  });

  return updated;
}

async function afterUpdateIngreso(updated, req, current) {
  const sincronizado = await actualizarAportacionIglesiaPorIngreso(updated, req, current);
  await notificarMovimientoModificado({
    tipo: 'ingreso',
    movimiento: sincronizado,
    req,
    current
  });
  return sincronizado;
}

async function afterDeleteIngreso(deleted, req) {
  await revertirAportacionIglesiaPorIngreso(deleted);
  await notificarMovimientoEliminado({
    tipo: 'ingreso',
    movimiento: deleted,
    req
  });
}

module.exports = {
  onCreateIngreso,
  onUpdateIngreso,
  beforeCreateIngreso,
  beforeUpdateIngreso,
  assertIngresoModificable,
  notificarIngresoCreado,
  afterCreateIngreso,
  afterUpdateIngreso,
  afterDeleteIngreso,
  aprobarIngreso,
  rechazarIngreso,
  normalizarEstado
};
