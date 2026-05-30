const { db } = require('../config/firebase');

function docToEntity(doc) {
  const id = Number(doc.id);
  return { id: Number.isNaN(id) ? doc.id : id, ...doc.data() };
}

function stripInternalFields(data) {
  const { passwordHash, password, ...rest } = data;
  return rest;
}

async function getNextId(collection) {
  const snap = await db.collection(collection).get();
  if (snap.empty) return 1;

  let max = 0;
  snap.forEach((doc) => {
    const n = Number(doc.id);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return max + 1;
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
  const nextId = await getNextId(collection);
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
  const date = new Date(iso);
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
  formatDateDDMMYYYY
};
