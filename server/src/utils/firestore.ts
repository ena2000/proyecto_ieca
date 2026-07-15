const { db } = require('../config/firebase');

function docToEntity(doc) {
  const rawId = Number(doc.id);
  const id = Number.isNaN(rawId) ? doc.id : rawId;
  // Nunca dejar que un campo `id` dentro del documento pise el ID real de Firestore:
  // si no, DELETE /:id puede borrar otro doc (o ninguno) y el registro “vuelve” al refrescar.
  const data = doc.data() || {};
  const { id: _ignored, ...rest } = data;
  return { ...rest, id };
}

function stripInternalFields(data) {
  const { passwordHash, password, refreshJti, ...rest } = data;
  return rest;
}

/**
 * Inicializa el contador de IDs con el máximo existente (solo si aún no hay doc).
 * Evita sobrescribir documentos al migrar desde getNextId por escaneo.
 */
async function ensureCounterInitialized(collection) {
  const counterRef = db.collection('_counters').doc(collection);
  const existing = await counterRef.get();
  if (existing.exists) return;

  const snap = await db.collection(collection).get();
  let max = 0;
  snap.forEach((doc) => {
    const n = Number(doc.id);
    if (!Number.isNaN(n) && n > max) max = n;
  });

  try {
    // create falla si otro request ya lo creó (carrera de arranque)
    if (typeof counterRef.create === 'function') {
      await counterRef.create({ seq: max });
    } else {
      const again = await counterRef.get();
      if (!again.exists) {
        await counterRef.set({ seq: max });
      }
    }
  } catch {
    // Ya inicializado por otra petición concurrente
  }
}

/**
 * ID secuencial atómico vía transacción sobre `_counters/{collection}`.
 */
async function allocateNextId(collection) {
  await ensureCounterInitialized(collection);
  const counterRef = db.collection('_counters').doc(collection);

  if (typeof db.runTransaction !== 'function') {
    // Fallback (p. ej. tests sin transacciones): escaneo + set
    const snap = await db.collection(collection).get();
    let max = 0;
    snap.forEach((doc) => {
      const n = Number(doc.id);
      if (!Number.isNaN(n) && n > max) max = n;
    });
    const next = max + 1;
    await counterRef.set({ seq: next }, { merge: true });
    return next;
  }

  return db.runTransaction(async (tx) => {
    const counterDoc = await tx.get(counterRef);
    const next = Number(counterDoc.data()?.seq || 0) + 1;
    tx.set(counterRef, { seq: next }, { merge: true });
    return next;
  });
}

/** Sincroniza el contador al máximo ID presente (p. ej. tras restore). */
async function syncCounterToMax(collection) {
  const snap = await db.collection(collection).get();
  let max = 0;
  snap.forEach((doc) => {
    const n = Number(doc.id);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  await db.collection('_counters').doc(collection).set({ seq: max }, { merge: true });
  return max;
}

async function listCollection(collection) {
  const snap = await db.collection(collection).get();
  return snap.docs
    .map(docToEntity)
    .sort((a, b) => Number(b.id) - Number(a.id));
}

async function listCollectionByField(collection, field, value) {
  const snap = await db.collection(collection).where(field, '==', value).get();
  return snap.docs
    .map(docToEntity)
    .sort((a, b) => Number(b.id) - Number(a.id));
}

async function getById(collection, id) {
  const doc = await db.collection(collection).doc(String(id)).get();
  if (!doc.exists) return null;
  return docToEntity(doc);
}

async function createInCollection(collection, body) {
  const nextId = await allocateNextId(collection);
  const id = String(nextId);
  const { id: _ignored, ...data } = body;
  await db.collection(collection).doc(id).set(data);
  return { id: nextId, ...data };
}

async function updateInCollection(collection, id, body) {
  const ref = db.collection(collection).doc(String(id));
  const doc = await ref.get();
  if (!doc.exists) return null;

  const { id: _ignored, ...data } = body;
  await ref.set(data, { merge: true });
  return { id: Number(id), ...doc.data(), ...data };
}

async function deleteFromCollection(collection, id) {
  const ref = db.collection(collection).doc(String(id));
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}

function formatDateDDMMYYYY(iso) {
  if (!iso) return '';
  const s = String(iso).trim();
  // Fecha calendario YYYY-MM-DD: no usar Date UTC (desfase de zona)
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const date = new Date(s);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

module.exports = {
  docToEntity,
  stripInternalFields,
  listCollection,
  listCollectionByField,
  getById,
  createInCollection,
  updateInCollection,
  deleteFromCollection,
  formatDateDDMMYYYY,
  allocateNextId,
  syncCounterToMax
};
