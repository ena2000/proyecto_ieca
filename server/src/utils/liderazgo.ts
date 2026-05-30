const { ROLES } = require('../middleware/auth');
const { listCollection, updateInCollection } = require('./firestore');

const ROL_LIDER = ROLES.LIDER;

function isRolSinMinisterio(rol) {
  return rol === ROLES.ADMIN || rol === ROLES.CONTABLE;
}

function usuarioEnMinisterio(min, userId, excluirMinisterioId = null) {
  if (userId == null) return false;
  const uid = Number(userId);
  if (excluirMinisterioId != null && Number(min.id) === Number(excluirMinisterioId)) {
    return false;
  }
  return Number(min.hldrId) === uid || Number(min.coLiderId) === uid;
}

function encontrarConflictoMinisterio(ministerios, userId, excluirMinisterioId) {
  return ministerios.find((m) => usuarioEnMinisterio(m, userId, excluirMinisterioId)) ?? null;
}

/**
 * Admin y Contable no llevan ministerio. Líder debe tener uno y no liderar otro.
 */
async function normalizarYValidarUsuario(body, usuarioId = null) {
  const rol = body.rol;

  if (isRolSinMinisterio(rol)) {
    body.ministerioId = null;
    return body;
  }

  if (rol !== ROL_LIDER) {
    body.ministerioId = null;
    return body;
  }

  const ministerioId = body.ministerioId != null && body.ministerioId !== ''
    ? Number(body.ministerioId)
    : null;

  if (ministerioId == null || Number.isNaN(ministerioId)) {
    const err = new Error('El rol Líder/CoLíder debe tener un ministerio asignado.');
    err.status = 400;
    throw err;
  }

  if (usuarioId != null) {
    const ministerios = await listCollection('ministerios');
    const conflicto = encontrarConflictoMinisterio(ministerios, usuarioId, ministerioId);
    if (conflicto) {
      const err = new Error(
        `Este usuario ya es líder o co-líder de "${conflicto.nombre}". Solo puede pertenecer a un ministerio.`
      );
      err.status = 400;
      throw err;
    }
  }

  body.ministerioId = ministerioId;
  return body;
}

async function validarUsuarioComoLiderDeMinisterio(userId, ministerioId, rolLabel, usuarios, ministerios) {
  if (userId == null) return;

  const uid = Number(userId);
  const user = usuarios.find((u) => Number(u.id) === uid);
  if (!user) {
    const err = new Error(`No se encontró el usuario seleccionado como ${rolLabel}.`);
    err.status = 400;
    throw err;
  }

  if (user.rol !== ROL_LIDER) {
    const err = new Error(
      `${user.nombre} debe tener rol Líder/CoLíder para ser ${rolLabel} de un ministerio.`
    );
    err.status = 400;
    throw err;
  }

  const conflicto = encontrarConflictoMinisterio(ministerios, uid, ministerioId);
  if (conflicto) {
    const err = new Error(
      `${user.nombre} ya es líder o co-líder de "${conflicto.nombre}". Solo puede pertenecer a un ministerio.`
    );
    err.status = 400;
    throw err;
  }

  if (
    user.ministerioId != null &&
    ministerioId != null &&
    Number(user.ministerioId) !== Number(ministerioId)
  ) {
    const err = new Error(
      `${user.nombre} está vinculado a otro ministerio en su perfil. Ajusta el usuario o el ministerio.`
    );
    err.status = 400;
    throw err;
  }
}

/**
 * Máximo un líder y un co-líder por ministerio; sin repetir persona ni cruzar ministerios.
 */
async function validarMinisterioLiderazgo(body, ministerioId = null) {
  const hldrId = body.hldrId != null && body.hldrId !== '' ? Number(body.hldrId) : null;
  const coLiderId = body.coLiderId != null && body.coLiderId !== '' ? Number(body.coLiderId) : null;

  body.hldrId = hldrId ?? undefined;
  body.coLiderId = coLiderId ?? undefined;

  if (hldrId != null && coLiderId != null && hldrId === coLiderId) {
    const err = new Error('El líder y el co-líder deben ser personas distintas.');
    err.status = 400;
    throw err;
  }

  const [ministerios, usuarios] = await Promise.all([
    listCollection('ministerios'),
    listCollection('usuarios')
  ]);

  await validarUsuarioComoLiderDeMinisterio(hldrId, ministerioId, 'líder', usuarios, ministerios);
  await validarUsuarioComoLiderDeMinisterio(coLiderId, ministerioId, 'co-líder', usuarios, ministerios);

  return body;
}

/** Tras guardar ministerio, alinea ministerioId en perfiles de líder y co-líder. */
async function sincronizarLideresMinisterio(ministerio) {
  const ministerioId = Number(ministerio.id);
  const ids = [ministerio.hldrId, ministerio.coLiderId].filter((id) => id != null);

  for (const userId of ids) {
    await updateInCollection('usuarios', userId, {
      ministerioId,
      rol: ROL_LIDER
    });
  }

  const usuarios = await listCollection('usuarios');
  for (const u of usuarios) {
    if (Number(u.ministerioId) !== ministerioId) continue;
    if (ids.some((id) => Number(id) === Number(u.id))) continue;
    if (u.rol !== ROL_LIDER) continue;
    await updateInCollection('usuarios', u.id, { ministerioId: null });
  }
}

module.exports = {
  normalizarYValidarUsuario,
  validarMinisterioLiderazgo,
  sincronizarLideresMinisterio,
  isRolSinMinisterio,
  ROL_LIDER
};
