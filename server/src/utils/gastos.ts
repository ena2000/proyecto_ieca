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
const { assertMinisterioPermiteGastos } = require('./ministerio-iglesia');

const COLLECTION = 'gastos';
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

function onCreateGasto(body, req) {
  /** @type {import('../types/firestore.types').MovimientoEstado} */
  const estado = estadoInicialPorRol(req.user?.rol);
  return {
    ...body,
    estado,
    motivoRechazo: estado === 'rechazado' ? body.motivoRechazo : null
  };
}

function onUpdateGasto(body, req, current) {
  const rol = req.user?.rol;
  if (esColaboradorMinisterio(rol)) {
    const estadoActual = normalizarEstado(current?.estado);
    if (estadoActual === 'aprobado') {
      const err = new Error('No puedes modificar un gasto ya aprobado');
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
    const err = new Error('El contable solo puede consultar gastos');
    err.status = 403;
    throw err;
  }
  return body;
}

async function assertGastoModificable(req, entity) {
  try {
    await assertMovimientoModificable(entity);
  } catch (err) {
    return { ok: false, message: err.message };
  }
  if (req.user?.rol === ROLES.CONTABLE) {
    return { ok: false, message: 'El contable solo puede consultar gastos' };
  }
  if (esColaboradorMinisterio(req.user?.rol) && normalizarEstado(entity?.estado) === 'aprobado') {
    return { ok: false, message: 'No puedes modificar un gasto ya aprobado' };
  }
  return { ok: true };
}

async function beforeCreateGasto(body, req) {
  if (req?.user?.rol === ROLES.CONTABLE) {
    const err = new Error('El contable solo puede consultar gastos');
    err.status = 403;
    throw err;
  }
  await assertPeriodoAbierto(body?.fecha);
  await assertMinisterioPermiteGastos(body);
}

async function beforeUpdateGasto(body, _req, current) {
  await assertMovimientoModificable(current);
  if (body?.fecha) await assertPeriodoAbierto(body.fecha);
  await assertMinisterioPermiteGastos({ ...current, ...body });
}

async function notificarGastoCreado(created, req) {
  return notificarMovimientoCreado({ tipo: 'gasto', movimiento: created, req });
}

async function aprobarGasto(id, req) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;

  await assertMovimientoModificable(current);

  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN) {
    const err = new Error('Solo el administrador puede aprobar gastos');
    err.status = 403;
    throw err;
  }

  if (normalizarEstado(current.estado) === 'aprobado') {
    return current;
  }

  if (normalizarEstado(current.estado) === 'rechazado') {
    const err = new Error('No se puede aprobar un gasto rechazado');
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
    return getById(COLLECTION, id);
  }

  const updated = await getById(COLLECTION, id);

  await notificarResolucionMovimientoLider({
    tipo: 'gasto',
    estado: 'aprobado',
    movimiento: current,
    req
  });

  return updated;
}

async function rechazarGasto(id, req, motivo) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;

  await assertMovimientoModificable(current);

  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN) {
    const err = new Error('Solo el administrador puede rechazar gastos');
    err.status = 403;
    throw err;
  }

  const actor = await resolveActor(req);
  const motivoTxt = motivo ? String(motivo).trim() : 'Sin motivo indicado';
  const updated = await updateInCollection(
    COLLECTION,
    id,
    stampActualizacion(
      {
        estado: 'rechazado',
        motivoRechazo: motivoTxt,
        rechazadoPor: req.user.sub,
        fechaRechazo: new Date().toISOString()
      },
      actor,
      current
    )
  );

  await notificarResolucionMovimientoLider({
    tipo: 'gasto',
    estado: 'rechazado',
    movimiento: current,
    motivo: motivoTxt,
    req
  });

  return updated;
}

async function afterUpdateGasto(updated, req, current) {
  await notificarMovimientoModificado({
    tipo: 'gasto',
    movimiento: updated,
    req,
    current
  });
}

async function afterDeleteGasto(deleted, req) {
  await notificarMovimientoEliminado({
    tipo: 'gasto',
    movimiento: deleted,
    req
  });
}

module.exports = {
  onCreateGasto,
  onUpdateGasto,
  beforeCreateGasto,
  beforeUpdateGasto,
  assertGastoModificable,
  notificarGastoCreado,
  afterUpdateGasto,
  afterDeleteGasto,
  aprobarGasto,
  rechazarGasto,
  normalizarEstado
};
