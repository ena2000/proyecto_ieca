const { db } = require('../config/firebase');
const { listCollection } = require('./firestore');

const COLLECTIONS_REPLACE = ['ingresos', 'gastos', 'ministerios', 'notificaciones'];
const BACKUP_VERSION = 'v1.0.0';
const CONFIG_DOC = 'sistema';

async function getConfigSistema() {
  const doc = await db.collection('config').doc(CONFIG_DOC).get();
  if (!doc.exists) return { ultimoCierre: null, periodosCerrados: [] };
  const data = doc.data();
  return {
    ultimoCierre: data.ultimoCierre ?? null,
    periodosCerrados: Array.isArray(data.periodosCerrados) ? data.periodosCerrados : []
  };
}

async function getUltimoCierre() {
  const cfg = await getConfigSistema();
  return cfg.ultimoCierre;
}

async function getPeriodosCerrados() {
  const cfg = await getConfigSistema();
  return cfg.periodosCerrados;
}

async function setUltimoCierre(value) {
  await db.collection('config').doc(CONFIG_DOC).set(
    { ultimoCierre: value ?? null },
    { merge: true }
  );
}

async function setCierreCompleto(ultimoCierre, periodosCerrados) {
  await db.collection('config').doc(CONFIG_DOC).set(
    {
      ultimoCierre: ultimoCierre ?? null,
      periodosCerrados: periodosCerrados ?? []
    },
    { merge: true }
  );
}

async function listUsuariosForBackup() {
  const lista = await listCollection('usuarios');
  return lista.map((u) => {
    const { password, passwordHash, ...rest } = u;
    return rest;
  });
}

async function buildBackup() {
  const [ingresos, gastos, ministerios, usuarios, notificaciones, configSistema] =
    await Promise.all([
      listCollection('ingresos'),
      listCollection('gastos'),
      listCollection('ministerios'),
      listUsuariosForBackup(),
      listCollection('notificaciones'),
      getConfigSistema()
    ]);

  return {
    fecha: new Date().toISOString(),
    version: BACKUP_VERSION,
    ingresos,
    gastos,
    ministerios,
    usuarios,
    notificaciones,
    ultimoCierre: configSistema.ultimoCierre,
    periodosCerrados: configSistema.periodosCerrados
  };
}

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batchSize = 400;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function writeCollection(name, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  for (const item of items) {
    if (item?.id == null) continue;
    const id = String(item.id);
    const { id: _ignored, ...data } = item;
    await db.collection(name).doc(id).set(data);
  }
}

async function restoreUsuarios(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  const snap = await db.collection('usuarios').get();
  const existingHashes = new Map();
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.passwordHash) {
      existingHashes.set(String(d.id), data.passwordHash);
    }
  });

  await clearCollection('usuarios');

  for (const item of items) {
    if (item?.id == null) continue;
    const id = String(item.id);
    const { id: _ignored, password, passwordHash: _plantedHash, refreshJti: _jti, ...rest } = item;
    const data = { ...rest };
    // Nunca aceptar passwordHash del payload (evita plantar hashes conocidos)
    delete data.passwordHash;
    delete data.refreshJti;
    if (password) {
      const bcrypt = require('bcryptjs');
      data.passwordHash = await bcrypt.hash(String(password), 10);
      data.passwordChangedAt = Date.now();
    } else if (existingHashes.has(id)) {
      data.passwordHash = existingHashes.get(id);
    }
    delete data.password;
    await db.collection('usuarios').doc(id).set(data);
  }
}

function validateBackup(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Backup inválido');
  }
  const required = ['ingresos', 'gastos', 'ministerios', 'usuarios'];
  for (const key of required) {
    if (!Array.isArray(body[key])) {
      throw new Error(`El backup debe incluir un arreglo "${key}"`);
    }
  }
}

async function restoreBackup(body) {
  validateBackup(body);

  for (const name of COLLECTIONS_REPLACE) {
    await clearCollection(name);
    const items = name === 'notificaciones'
      ? (body.notificaciones ?? [])
      : body[name];
    await writeCollection(name, items);
  }

  await restoreUsuarios(body.usuarios);
  await setCierreCompleto(
    body.ultimoCierre ?? null,
    body.periodosCerrados ?? []
  );

  // Re-sincronizar contadores de ID tras restore
  const { syncCounterToMax } = require('./firestore');
  for (const name of [...COLLECTIONS_REPLACE, 'usuarios']) {
    await syncCounterToMax(name);
  }

  return buildBackup();
}

module.exports = {
  BACKUP_VERSION,
  buildBackup,
  restoreBackup,
  getUltimoCierre,
  getPeriodosCerrados,
  setUltimoCierre,
  setCierreCompleto
};
