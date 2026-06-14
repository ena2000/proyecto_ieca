const { ROLES, esColaboradorMinisterio } = require('../middleware/auth');
const { createNotificacion } = require('./notificaciones');

function mensajeMovimiento(movimiento, sufijo) {
  const ministerio = movimiento.ministerio || 'General';
  const monto = Number(movimiento.monto || 0).toFixed(2);
  const desc = movimiento.descripcion || 'Sin descripción';
  return `${ministerio} · ${desc} · $ ${monto} — ${sufijo}`;
}

function actorUserId(req) {
  return req?.user?.sub != null ? String(req.user.sub) : null;
}

function origenRolReq(req) {
  return req?.user?.rol ?? null;
}

function rutaTipo(tipo) {
  return tipo === 'gasto' ? '/gastos' : '/ingresos';
}

function etiquetaTipo(tipo, minuscula = false) {
  const e = tipo === 'gasto' ? 'Gasto' : 'Ingreso';
  return minuscula ? e.toLowerCase() : e;
}

/** Avisa al colaborador del ministerio (no al administrador que aprobó/rechazó). */
async function notificarResolucionMovimientoColaborador({ tipo, estado, movimiento, motivo, req }) {
  const ministerioId = movimiento.ministerioId;
  if (ministerioId == null || ministerioId === '') return null;

  const etiqueta = etiquetaTipo(tipo, true);
  const ruta = rutaTipo(tipo);
  const actor = actorUserId(req);

  if (estado === 'aprobado') {
    return createNotificacion({
      tipo,
      audiencia: 'colaborador',
      ministerioId: Number(ministerioId),
      actorUserId: actor,
      titulo: `Tu ${etiqueta} fue aprobado`,
      mensaje: mensajeMovimiento(movimiento, 'fue aprobado.'),
      ruta
    });
  }

  const motivoTxt = motivo ? String(motivo).trim() : 'Sin motivo indicado';
  return createNotificacion({
    tipo,
    audiencia: 'colaborador',
    ministerioId: Number(ministerioId),
    actorUserId: actor,
    titulo: `Tu ${etiqueta} fue rechazado`,
    mensaje: mensajeMovimiento(movimiento, `fue rechazado. Motivo: ${motivoTxt}`),
    ruta
  });
}

/** Avisa a admin/contable (no al líder que corrigió). */
async function notificarMovimientoReenviadoStaff({ tipo, movimiento, req }) {
  const etiqueta = etiquetaTipo(tipo);
  return createNotificacion({
    tipo,
    audiencia: 'staff',
    origenRol: ROLES.COLABORADOR,
    actorUserId: actorUserId(req),
    titulo: `${etiqueta} corregido (pendiente de aprobación)`,
    mensaje: mensajeMovimiento(
      movimiento,
      'fue corregido tras un rechazo y requiere nueva revisión.'
    ),
    ruta: rutaTipo(tipo)
  });
}

/** Notifica a la otra parte cuando alguien modifica un movimiento (PUT). */
async function notificarMovimientoModificado({ tipo, movimiento, req, current }) {
  const rol = req?.user?.rol;
  const actor = actorUserId(req);
  const prev = current?.estado;
  const next = movimiento?.estado;

  if (esColaboradorMinisterio(rol)) {
    if (prev === 'rechazado' && next === 'pendiente') {
      return notificarMovimientoReenviadoStaff({ tipo, movimiento, req });
    }
    return createNotificacion({
      tipo,
      audiencia: 'staff',
      origenRol: ROLES.COLABORADOR,
      actorUserId: actor,
      titulo: `${etiquetaTipo(tipo)} actualizado (pendiente de aprobación)`,
      mensaje: mensajeMovimiento(
        movimiento,
        'fue modificado y sigue pendiente de revisión.'
      ),
      ruta: rutaTipo(tipo)
    });
  }

  if (rol === ROLES.ADMIN || rol === ROLES.CONTABLE) {
    const ministerioId = movimiento.ministerioId;
    if (ministerioId == null || ministerioId === '') return null;
    return createNotificacion({
      tipo,
      audiencia: 'colaborador',
      ministerioId: Number(ministerioId),
      actorUserId: actor,
      titulo: `Tu ${etiquetaTipo(tipo, true)} fue modificado`,
      mensaje: mensajeMovimiento(
        movimiento,
        'fue modificado por administración o contable.'
      ),
      ruta: rutaTipo(tipo)
    });
  }

  return null;
}

/** Notifica a la otra parte cuando alguien elimina un movimiento. */
async function notificarMovimientoEliminado({ tipo, movimiento, req }) {
  const rol = req?.user?.rol;
  const actor = actorUserId(req);

  if (esColaboradorMinisterio(rol)) {
    return createNotificacion({
      tipo,
      audiencia: 'staff',
      origenRol: ROLES.COLABORADOR,
      actorUserId: actor,
      titulo: `${etiquetaTipo(tipo)} eliminado`,
      mensaje: mensajeMovimiento(movimiento, 'fue eliminado por un colaborador del ministerio.'),
      ruta: rutaTipo(tipo)
    });
  }

  if (rol === ROLES.ADMIN || rol === ROLES.CONTABLE) {
    const ministerioId = movimiento.ministerioId;
    if (ministerioId == null || ministerioId === '') return null;
    return createNotificacion({
      tipo,
      audiencia: 'colaborador',
      ministerioId: Number(ministerioId),
      actorUserId: actor,
      titulo: `Tu ${etiquetaTipo(tipo, true)} fue eliminado`,
      mensaje: mensajeMovimiento(
        movimiento,
        'fue eliminado por administración o contable.'
      ),
      ruta: rutaTipo(tipo)
    });
  }

  return null;
}

/** Nuevo movimiento: avisa a staff si lo creó el líder (no al creador). */
async function notificarMovimientoCreado({ tipo, movimiento, req }) {
  const rol = req?.user?.rol;
  const actor = actorUserId(req);
  const etiqueta = etiquetaTipo(tipo);
  const base = mensajeMovimiento(movimiento, '');

  if (esColaboradorMinisterio(rol) && movimiento.estado === 'pendiente') {
    return createNotificacion({
      tipo,
      audiencia: 'staff',
      origenRol: ROLES.COLABORADOR,
      actorUserId: actor,
      titulo: `${etiqueta} pendiente de aprobación`,
      mensaje: base.replace(/ — $/, ''),
      ruta: rutaTipo(tipo)
    });
  }

  if (rol === ROLES.ADMIN || rol === ROLES.CONTABLE) {
    const ministerioId = movimiento.ministerioId;
    if (ministerioId != null && ministerioId !== '') {
      return createNotificacion({
        tipo,
        audiencia: 'colaborador',
        ministerioId: Number(ministerioId),
        actorUserId: actor,
        titulo: `Nuevo ${etiquetaTipo(tipo, true)} registrado`,
        mensaje: mensajeMovimiento(movimiento, 'fue registrado por administración.'),
        ruta: rutaTipo(tipo)
      });
    }
    return createNotificacion({
      tipo,
      audiencia: 'staff',
      origenRol: origenRolReq(req),
      actorUserId: actor,
      titulo: `Nuevo ${etiqueta.toLowerCase()}`,
      mensaje: base.replace(/ — $/, ''),
      ruta: rutaTipo(tipo)
    });
  }

  return null;
}

module.exports = {
  notificarResolucionMovimientoColaborador,
  /** @deprecated Use notificarResolucionMovimientoColaborador */
  notificarResolucionMovimientoLider: notificarResolucionMovimientoColaborador,
  notificarMovimientoReenviadoStaff,
  notificarMovimientoModificado,
  notificarMovimientoEliminado,
  notificarMovimientoCreado,
  mensajeMovimiento
};
