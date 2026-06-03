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

const COLLECTION = 'gastos';
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
  if (rol === ROLES.LIDER) {
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
    const err = new Error('El contable solo puede aprobar o rechazar gastos');
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
    return { ok: false, message: 'El contable solo puede aprobar o rechazar gastos' };
  }
  if (req.user?.rol === ROLES.LIDER && normalizarEstado(entity?.estado) === 'aprobado') {
    return { ok: false, message: 'No puedes modificar un gasto ya aprobado' };
  }
  return { ok: true };
}

async function beforeCreateGasto(body) {
  await assertPeriodoAbierto(body?.fecha);
}

async function beforeUpdateGasto(body, current) {
  await assertMovimientoModificable(current);
  if (body?.fecha) await assertPeriodoAbierto(body.fecha);
}

async function notificarGastoCreado(created, req) {
  return notificarMovimientoCreado({ tipo: 'gasto', movimiento: created, req });
}

async function aprobarGasto(id, req) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;

  await assertMovimientoModificable(current);

  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN && rol !== ROLES.CONTABLE) {
    const err = new Error('No tienes permiso para aprobar gastos');
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
  if (rol !== ROLES.ADMIN && rol !== ROLES.CONTABLE) {
    const err = new Error('No tienes permiso para rechazar gastos');
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
