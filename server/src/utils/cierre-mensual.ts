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

function contarPendientesDelPeriodo(ingresos, gastos, periodoKey) {
  const esPendiente = (item) =>
    fechaToPeriodoKey(item.fecha) === periodoKey && String(item.estado || '') === 'pendiente';
  return ingresos.filter(esPendiente).length + gastos.filter(esPendiente).length;
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

  const pendientes = contarPendientesDelPeriodo(ingresos, gastos, periodoKey);
  if (pendientes > 0) {
    throw new HttpError(
      409,
      `No se puede cerrar el periodo: hay ${pendientes} movimiento(s) pendiente(s) de aprobación.`
    );
  }

  const updates = [
    ...collectMovimientosDelPeriodo(ingresos, periodoKey, 'ingresos'),
    ...collectMovimientosDelPeriodo(gastos, periodoKey, 'gastos')
  ];

  // Config primero: si falla el batch, el periodo ya figura cerrado (fail-closed para nuevos)
  const cerrados = await getPeriodosCerrados();
  const nuevosCerrados = [...new Set([...cerrados, periodoKey])];
  const etiqueta = etiquetaParaMes(periodoKey);
  await setCierreConfig(etiqueta, nuevosCerrados);

  try {
    await commitBatches(updates);
  } catch (err) {
    // Revertir config si no se pudieron marcar los docs
    await setCierreConfig(
      cerrados.length ? etiquetaParaMes(cerrados[cerrados.length - 1]) : null,
      cerrados
    );
    throw err;
  }

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
  contarPendientesDelPeriodo,
  ejecutarCierreMensual
};
