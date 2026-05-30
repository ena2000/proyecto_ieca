const { db } = require('../config/firebase');
const { listCollection } = require('./firestore');
const {
  fechaToPeriodoKey,
  etiquetaParaMes,
  getPeriodosCerrados,
  isPeriodoCerrado,
  setCierreConfig
} = require('./cierre');
const { HttpError } = require('./httpError');

const FIRESTORE_BATCH_LIMIT = 500;

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Agrupa movimientos del periodo para marcarlos cerrados en lotes de Firestore. */
function collectMovimientosDelPeriodo(items, periodoKey, collection) {
  return items
    .filter((item) => fechaToPeriodoKey(item.fecha) === periodoKey)
    .map((item) => ({
      collection,
      id: String(item.id),
      data: { cerrado: true, periodoCierre: periodoKey }
    }));
}

async function commitBatches(updates) {
  const chunks = chunkArray(updates, FIRESTORE_BATCH_LIMIT);
  for (const chunk of chunks) {
    const batch = db.batch();
    for (const u of chunk) {
      const ref = db.collection(u.collection).doc(u.id);
      batch.set(ref, u.data, { merge: true });
    }
    await batch.commit();
  }
}

/**
 * Cierra un periodo: marca ingresos/gastos del mes y actualiza config.
 * @param {string} periodoKey - Clave YYYY-MM
 */
async function ejecutarCierreMensual(periodoKey) {
  if (!periodoKey) {
    throw new HttpError(400, 'Periodo inválido');
  }

  if (await isPeriodoCerrado(periodoKey)) {
    throw new HttpError(
      409,
      `El periodo ${etiquetaParaMes(periodoKey)} ya fue cerrado.`
    );
  }

  const [ingresos, gastos] = await Promise.all([
    listCollection('ingresos'),
    listCollection('gastos')
  ]);

  const updates = [
    ...collectMovimientosDelPeriodo(ingresos, periodoKey, 'ingresos'),
    ...collectMovimientosDelPeriodo(gastos, periodoKey, 'gastos')
  ];

  await commitBatches(updates);

  const cerrados = await getPeriodosCerrados();
  const nuevosCerrados = [...new Set([...cerrados, periodoKey])];
  const etiqueta = etiquetaParaMes(periodoKey);
  await setCierreConfig(etiqueta, nuevosCerrados);

  return {
    ultimoCierre: etiqueta,
    periodosCerrados: nuevosCerrados,
    periodoCerrado: periodoKey,
    movimientosMarcados: updates.length
  };
}

module.exports = {
  FIRESTORE_BATCH_LIMIT,
  chunkArray,
  collectMovimientosDelPeriodo,
  ejecutarCierreMensual
};
