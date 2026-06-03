const { ROLES } = require('../middleware/auth');
const { getById, updateInCollection } = require('./firestore');
const {
  notificarResolucionMovimientoLider,
  notificarMovimientoModificado,
  notificarMovimientoEliminado,
  notificarMovimientoCreado
} = require('./notificacion-movimiento');
const { stampActualizacion, resolveActor } = require('./auditoria');
const { assertPeriodoAbierto, assertMovimientoModificable } = require('./cierre');

const COLLECTION = 'ingresos';
const ESTADOS = new Set(['pendiente', 'aprobado', 'rechazado']);

/** @param {unknown} estado @returns {import('../types/firestore.types').MovimientoEstado} */
function normalizarEstado(estado) {
  if (!estado) return 'aprobado';
  return ESTADOS.has(estado) ? estado : 'aprobado';
}

function estadoInicialPorRol(rol): import('../types/firestore.types').MovimientoEstado {
  if (rol === ROLES.LIDER) return 'pendiente';
  if (rol === ROLES.ADMIN || rol === ROLES.CONTABLE) return 'aprobado';
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
  if (rol === ROLES.LIDER) {
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
    const err = new Error('El contable solo puede aprobar o rechazar ingresos');
    err.status = 403;
    throw err;
  }
  return body;
}

async function assertIngresoModificable(req, entity) {
  try {
    await assertMovimientoModificable(entity);
  } catch (err) {
    return { ok: false, message: err.message };
  }
  if (req.user?.rol === ROLES.CONTABLE) {
    return { ok: false, message: 'El contable solo puede aprobar o rechazar ingresos' };
  }
  if (req.user?.rol === ROLES.LIDER && normalizarEstado(entity?.estado) === 'aprobado') {
    return { ok: false, message: 'No puedes modificar un ingreso ya aprobado' };
  }
  return { ok: true };
}

async function beforeCreateIngreso(body) {
  await assertPeriodoAbierto(body?.fecha);
}

async function beforeUpdateIngreso(body, current) {
  await assertMovimientoModificable(current);
  if (body?.fecha) await assertPeriodoAbierto(body.fecha);
}

async function notificarIngresoCreado(created, req) {
  return notificarMovimientoCreado({ tipo: 'ingreso', movimiento: created, req });
}

async function aprobarIngreso(id, req) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;

  await assertMovimientoModificable(current);

  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN && rol !== ROLES.CONTABLE) {
    const err = new Error('No tienes permiso para aprobar ingresos');
    err.status = 403;
    throw err;
  }

  if (normalizarEstado(current.estado) === 'aprobado') {
    return current;
  }

  const actor = await resolveActor(req);
  const updated = await updateInCollection(
    COLLECTION,
    id,
    stampActualizacion(
      {
        estado: 'aprobado',
        motivoRechazo: null,
        aprobadoPor: req.user.sub,
        fechaAprobacion: new Date().toISOString()
      },
      actor,
      current
    )
  );

  await notificarResolucionMovimientoLider({
    tipo: 'ingreso',
    estado: 'aprobado',
    movimiento: current,
    req
  });

  return updated;
}

async function rechazarIngreso(id, req, motivo) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;

  await assertMovimientoModificable(current);

  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN && rol !== ROLES.CONTABLE) {
    const err = new Error('No tienes permiso para rechazar ingresos');
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
    tipo: 'ingreso',
    estado: 'rechazado',
    movimiento: current,
    motivo: motivoTxt,
    req
  });

  return updated;
}

async function afterUpdateIngreso(updated, req, current) {
  await notificarMovimientoModificado({
    tipo: 'ingreso',
    movimiento: updated,
    req,
    current
  });
}

async function afterDeleteIngreso(deleted, req) {
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
  afterUpdateIngreso,
  afterDeleteIngreso,
  aprobarIngreso,
  rechazarIngreso,
  normalizarEstado
};
