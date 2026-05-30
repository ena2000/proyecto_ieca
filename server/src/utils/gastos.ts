const { ROLES } = require('../middleware/auth');
const { getById, updateInCollection } = require('./firestore');
const { createNotificacion } = require('./notificaciones');
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

async function notificarGastoCreado(created) {
  const ministerio = created.ministerio || 'General';
  const monto = Number(created.monto || 0).toFixed(2);
  const base = `${ministerio} · ${created.descripcion || ''} · $ ${monto}`;

  if (created.estado === 'pendiente') {
    return createNotificacion({
      tipo: 'gasto',
      titulo: 'Gasto pendiente de aprobación',
      mensaje: base,
      ruta: '/gastos'
    });
  }

  return createNotificacion({
    tipo: 'gasto',
    titulo: 'Nuevo gasto',
    mensaje: base,
    ruta: '/gastos'
  });
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

  await createNotificacion({
    tipo: 'gasto',
    titulo: 'Gasto aprobado',
    mensaje: `${current.ministerio || 'General'} · ${current.descripcion || ''} fue aprobado.`,
    ruta: '/gastos'
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
  const updated = await updateInCollection(
    COLLECTION,
    id,
    stampActualizacion(
      {
        estado: 'rechazado',
        motivoRechazo: motivo ? String(motivo).trim() : 'Sin motivo indicado',
        rechazadoPor: req.user.sub,
        fechaRechazo: new Date().toISOString()
      },
      actor,
      current
    )
  );

  return updated;
}

module.exports = {
  onCreateGasto,
  onUpdateGasto,
  beforeCreateGasto,
  beforeUpdateGasto,
  assertGastoModificable,
  notificarGastoCreado,
  aprobarGasto,
  rechazarGasto,
  normalizarEstado
};
