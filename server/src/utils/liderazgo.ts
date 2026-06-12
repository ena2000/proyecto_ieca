const { ROLES, normalizarRol, esColaboradorMinisterio } = require('../middleware/auth');
const { listCollection } = require('./firestore');

const ROL_COLABORADOR = ROLES.COLABORADOR;

function isRolSinMinisterio(rol) {
  const normalizado = normalizarRol(rol);
  return normalizado === ROLES.ADMIN || normalizado === ROLES.CONTABLE;
}

/**
 * Admin y Contable no llevan ministerio. Colaborador puede crearse sin ministerio
 * y vincularse después en Usuarios.
 */
async function normalizarYValidarUsuario(body, _usuarioId = null) {
  const rol = normalizarRol(body.rol);
  if (rol) {
    body.rol = rol;
  }

  if (isRolSinMinisterio(rol)) {
    body.ministerioId = null;
    return body;
  }

  if (!esColaboradorMinisterio(rol)) {
    body.ministerioId = null;
    return body;
  }

  const ministerioId = body.ministerioId != null && body.ministerioId !== ''
    ? Number(body.ministerioId)
    : null;

  if (ministerioId == null || Number.isNaN(ministerioId)) {
    body.ministerioId = null;
    return body;
  }

  const ministerios = await listCollection('ministerios');
  const min = ministerios.find((m) => Number(m.id) === ministerioId);
  if (!min) {
    const err = new Error('Ministerio no válido.');
    err.status = 400;
    throw err;
  }

  body.ministerioId = ministerioId;
  return body;
}

/** Los colaboradores se gestionan en Usuarios; ya no hay líder/co-líder en ministerios. */
async function validarMinisterioLiderazgo(body, _ministerioId = null) {
  body.hldrId = null;
  body.coLiderId = null;
  return body;
}

/** @deprecated Ya no sincroniza líderes; conservado por compatibilidad con hooks CRUD. */
async function sincronizarLideresMinisterio(_ministerio) {
  return;
}

function colaboradoresEnMinisterio(ministerioId, usuarios) {
  return usuarios.filter(
    (u) =>
      esColaboradorMinisterio(u.rol) &&
      u.estado !== 'Inactivo' &&
      Number(u.ministerioId) === Number(ministerioId)
  );
}

module.exports = {
  normalizarYValidarUsuario,
  validarMinisterioLiderazgo,
  sincronizarLideresMinisterio,
  isRolSinMinisterio,
  colaboradoresEnMinisterio,
  esColaboradorMinisterio,
  ROL_COLABORADOR
};
