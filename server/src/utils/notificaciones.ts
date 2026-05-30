const {
  listCollection,
  createInCollection,
  getById,
  updateInCollection
} = require('./firestore');

const COLLECTION = 'notificaciones';
const MAX_ITEMS = 40;

const TIPOS_VALIDOS = new Set(['ingreso', 'gasto', 'cierre']);

function toNotificacion(entity) {
  if (!entity) return null;
  return {
    id: String(entity.id),
    tipo: entity.tipo,
    titulo: entity.titulo,
    mensaje: entity.mensaje,
    ruta: entity.ruta || undefined,
    fecha: entity.fecha,
    leidasPor: Array.isArray(entity.leidasPor) ? entity.leidasPor.map(String) : []
  };
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

async function createNotificacion({ tipo, titulo, mensaje, ruta }) {
  if (!TIPOS_VALIDOS.has(tipo)) {
    throw new Error('Tipo de notificación inválido');
  }
  const created = await createInCollection(COLLECTION, {
    tipo,
    titulo: String(titulo ?? '').trim(),
    mensaje: String(mensaje ?? '').trim(),
    ruta: ruta ? String(ruta) : null,
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

async function marcarLeida(id, userId) {
  const current = await getById(COLLECTION, id);
  if (!current) return null;
  const leidasPor = addUserToLeidas(current.leidasPor, userId);
  const updated = await updateInCollection(COLLECTION, id, { leidasPor });
  return toNotificacion(updated);
}

async function marcarTodasLeidas(userId) {
  const lista = await listCollection(COLLECTION);
  const uid = String(userId);
  await Promise.all(
    lista.map(async (n) => {
      const leidasPor = addUserToLeidas(n.leidasPor, uid);
      await updateInCollection(COLLECTION, n.id, { leidasPor });
    })
  );
  return listNotificaciones();
}

async function marcarLeidasPorRuta(userId, ruta) {
  const lista = await listCollection(COLLECTION);
  const uid = String(userId);
  const target = String(ruta);
  await Promise.all(
    lista
      .filter((n) => n.ruta === target)
      .map(async (n) => {
        const leidasPor = addUserToLeidas(n.leidasPor, uid);
        await updateInCollection(COLLECTION, n.id, { leidasPor });
      })
  );
  return listNotificaciones();
}

async function marcarLeidasPorTipo(userId, tipo) {
  const lista = await listCollection(COLLECTION);
  const uid = String(userId);
  await Promise.all(
    lista
      .filter((n) => n.tipo === tipo)
      .map(async (n) => {
        const leidasPor = addUserToLeidas(n.leidasPor, uid);
        await updateInCollection(COLLECTION, n.id, { leidasPor });
      })
  );
  return listNotificaciones();
}

module.exports = {
  COLLECTION,
  TIPOS_VALIDOS,
  createNotificacion,
  listNotificaciones,
  getNotificacionById,
  marcarLeida,
  marcarTodasLeidas,
  marcarLeidasPorRuta,
  marcarLeidasPorTipo,
  toNotificacion
};
