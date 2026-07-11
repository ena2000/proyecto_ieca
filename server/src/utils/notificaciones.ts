const {
  listCollection,
  createInCollection,
  getById,
  updateInCollection
} = require('./firestore');

const { ROLES, esColaboradorMinisterio, ROL_LIDER_LEGACY } = require('../middleware/auth');

const COLLECTION = 'notificaciones';
const MAX_ITEMS = 40;

const TIPOS_VALIDOS = new Set(['ingreso', 'gasto', 'cierre']);
const AUDIENCIAS_VALIDAS = new Set(['staff', 'colaborador', 'lider']);

function normalizarAudiencia(aud) {
  if (aud === 'colaborador' || aud === 'lider') return 'colaborador';
  return 'staff';
}

function audienciaParaGuardar(aud) {
  const raw = String(aud || 'staff');
  if (!AUDIENCIAS_VALIDAS.has(raw)) {
    return null;
  }
  return normalizarAudiencia(raw);
}

function toNotificacion(entity) {
  if (!entity) return null;
  return {
    id: String(entity.id),
    tipo: entity.tipo,
    titulo: entity.titulo,
    mensaje: entity.mensaje,
    ruta: entity.ruta || undefined,
    fecha: entity.fecha,
    audiencia: normalizarAudiencia(entity.audiencia || 'staff'),
    ministerioId:
      entity.ministerioId != null && entity.ministerioId !== ''
        ? Number(entity.ministerioId)
        : undefined,
    actorUserId:
      entity.actorUserId != null && entity.actorUserId !== ''
        ? String(entity.actorUserId)
        : undefined,
    origenRol:
      entity.origenRol != null && entity.origenRol !== ''
        ? String(entity.origenRol)
        : undefined,
    leidasPor: Array.isArray(entity.leidasPor) ? entity.leidasPor.map(String) : []
  };
}

function esOrigenColaborador(origenRol) {
  return origenRol === ROLES.COLABORADOR || origenRol === ROL_LIDER_LEGACY;
}

/** Admin: staff completo. Contable: movimientos de colaboradores. Colaborador: su ministerio. */
function filterNotificacionesForUser(lista, user) {
  const rol = user?.rol;
  const ministerioId = user?.ministerioId;
  const uid = user?.sub != null ? String(user.sub) : '';

  return lista.filter((n) => {
    if (uid && n.actorUserId && String(n.actorUserId) === uid) {
      return false;
    }
    const aud = normalizarAudiencia(n.audiencia);
    if (esColaboradorMinisterio(rol)) {
      if (aud !== 'colaborador') return false;
      if (n.ministerioId == null || ministerioId == null) return false;
      return Number(n.ministerioId) === Number(ministerioId);
    }
    if (rol === ROLES.ADMIN) {
      return aud === 'staff';
    }
    if (rol === ROLES.CONTABLE) {
      return aud === 'staff' && esOrigenColaborador(n.origenRol);
    }
    return false;
  });
}

function userPuedeNotificaciones(user) {
  const rol = user?.rol;
  return rol === ROLES.ADMIN || rol === ROLES.CONTABLE || esColaboradorMinisterio(rol);
}

async function trimNotificaciones() {
  const snap = await listCollection(COLLECTION);
  const sorted = [...snap].sort((a, b) => {
    const fa = new Date(a.fecha || 0).getTime();
    const fb = new Date(b.fecha || 0).getTime();
    return fb - fa;
  });
  if (sorted.length <= MAX_ITEMS) return;
  const { db } = require('../config/firebase');
  const excess = sorted.slice(MAX_ITEMS);
  await Promise.all(
    excess.map((n) => db.collection(COLLECTION).doc(String(n.id)).delete())
  );
}

async function createNotificacion({
  tipo,
  titulo,
  mensaje,
  ruta,
  audiencia = 'staff',
  ministerioId = null,
  actorUserId = null,
  origenRol = null
}) {
  if (!TIPOS_VALIDOS.has(tipo)) {
    throw new Error('Tipo de notificación inválido');
  }
  const aud = audienciaParaGuardar(audiencia);
  if (!aud) {
    throw new Error('Audiencia de notificación inválida');
  }
  const created = await createInCollection(COLLECTION, {
    tipo,
    titulo: String(titulo ?? '').trim(),
    mensaje: String(mensaje ?? '').trim(),
    ruta: ruta ? String(ruta) : null,
    audiencia: aud,
    ministerioId:
      ministerioId != null && ministerioId !== '' ? Number(ministerioId) : null,
    actorUserId:
      actorUserId != null && actorUserId !== '' ? String(actorUserId) : null,
    origenRol:
      origenRol != null && origenRol !== '' ? String(origenRol) : null,
    fecha: new Date().toISOString(),
    leidasPor: []
  });
  await trimNotificaciones();
  return toNotificacion(created);
}

async function listNotificaciones() {
  const lista = await listCollection(COLLECTION);
  return lista
    .map(toNotificacion)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

async function listNotificacionesForUser(user) {
  const lista = await listNotificaciones();
  return filterNotificacionesForUser(lista, user);
}

async function getVisibleIdsForUser(user) {
  const visible = await listNotificacionesForUser(user);
  return new Set(visible.map((n) => String(n.id)));
}

async function getNotificacionById(id) {
  const item = await getById(COLLECTION, id);
  return toNotificacion(item);
}

function addUserToLeidas(leidasPor, userId) {
  const uid = String(userId);
  const set = new Set((leidasPor ?? []).map(String));
  set.add(uid);
  return Array.from(set);
}

async function marcarLeida(id, userId, user) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;
  if (user) {
    const visibleIds = await getVisibleIdsForUser(user);
    if (!visibleIds.has(String(id))) {
      const err = new Error('No tienes permisos para esta notificación');
      err.status = 403;
      throw err;
    }
  }
  const leidasPor = addUserToLeidas(current.leidasPor, userId);
  const updated = await updateInCollection(COLLECTION, id, { leidasPor });
  return toNotificacion(updated);
}

async function marcarTodasLeidas(userId, user) {
  const lista = await listCollection(COLLECTION);
  const uid = String(userId);
  const visibleIds = await getVisibleIdsForUser(user);
  await Promise.all(
    lista
      .filter((n) => visibleIds.has(String(n.id)))
      .map(async (n) => {
        const leidasPor = addUserToLeidas(n.leidasPor, uid);
        await updateInCollection(COLLECTION, n.id, { leidasPor });
      })
  );
  return listNotificacionesForUser(user);
}

async function marcarLeidasPorRuta(userId, ruta, user) {
  const lista = await listCollection(COLLECTION);
  const uid = String(userId);
  const target = String(ruta);
  const visibleIds = await getVisibleIdsForUser(user);
  await Promise.all(
    lista
      .filter((n) => n.ruta === target && visibleIds.has(String(n.id)))
      .map(async (n) => {
        const leidasPor = addUserToLeidas(n.leidasPor, uid);
        await updateInCollection(COLLECTION, n.id, { leidasPor });
      })
  );
  return listNotificacionesForUser(user);
}

async function marcarLeidasPorTipo(userId, tipo, user) {
  const lista = await listCollection(COLLECTION);
  const uid = String(userId);
  const visibleIds = await getVisibleIdsForUser(user);
  await Promise.all(
    lista
      .filter((n) => n.tipo === tipo && visibleIds.has(String(n.id)))
      .map(async (n) => {
        const leidasPor = addUserToLeidas(n.leidasPor, uid);
        await updateInCollection(COLLECTION, n.id, { leidasPor });
      })
  );
  return listNotificacionesForUser(user);
}

module.exports = {
  COLLECTION,
  TIPOS_VALIDOS,
  createNotificacion,
  listNotificaciones,
  listNotificacionesForUser,
  filterNotificacionesForUser,
  userPuedeNotificaciones,
  getNotificacionById,
  marcarLeida,
  marcarTodasLeidas,
  marcarLeidasPorRuta,
  marcarLeidasPorTipo,
  toNotificacion
};
