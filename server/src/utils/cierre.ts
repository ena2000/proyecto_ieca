const { db } = require('../config/firebase');
const {
  MESES_ES,
  getMesActualKey,
  getMesActualLabel,
  labelToPeriodoKey,
  fechaToPeriodoKey,
  etiquetaParaMes,
  entityBloqueadoPorCierre
} = require('./periodo.util');

const CONFIG_DOC = 'sistema';

async function readConfigSistema() {
  const doc = await db.collection('config').doc(CONFIG_DOC).get();
  return doc.exists ? doc.data() : {};
}

async function getPeriodosCerrados() {
  const data = await readConfigSistema();
  if (Array.isArray(data.periodosCerrados) && data.periodosCerrados.length) {
    return [...new Set(data.periodosCerrados.filter(Boolean))];
  }
  if (data.ultimoCierre) {
    const key = labelToPeriodoKey(data.ultimoCierre);
    return key ? [key] : [];
  }
  return [];
}

async function getUltimoCierreLabel() {
  const data = await readConfigSistema();
  return data.ultimoCierre ?? null;
}

async function setCierreConfig(ultimoCierreLabel, periodosCerrados) {
  await db.collection('config').doc(CONFIG_DOC).set(
    {
      ultimoCierre: ultimoCierreLabel ?? null,
      periodosCerrados: [...new Set((periodosCerrados || []).filter(Boolean))]
    },
    { merge: true }
  );
}

async function isPeriodoCerrado(periodoKey) {
  if (!periodoKey) return false;
  const cerrados = await getPeriodosCerrados();
  return cerrados.includes(periodoKey);
}

async function assertPeriodoAbierto(fecha) {
  const key = fechaToPeriodoKey(fecha);
  if (!key) return;
  if (await isPeriodoCerrado(key)) {
    const err = new Error(
      `El periodo ${etiquetaParaMes(key)} está cerrado. No se pueden registrar ni modificar movimientos.`
    );
    err.status = 403;
    throw err;
  }
}

async function assertMovimientoModificable(entity) {
  const cerrados = await getPeriodosCerrados();
  if (entityBloqueadoPorCierre(entity, cerrados)) {
    const key = fechaToPeriodoKey(entity?.fecha);
    const err = new Error(
      key
        ? `El periodo ${etiquetaParaMes(key)} está cerrado. No se pueden registrar ni modificar movimientos.`
        : 'Este movimiento pertenece a un periodo cerrado.'
    );
    err.status = 403;
    throw err;
  }
}

module.exports = {
  MESES_ES,
  getMesActualKey,
  getMesActualLabel,
  labelToPeriodoKey,
  fechaToPeriodoKey,
  etiquetaParaMes,
  getPeriodosCerrados,
  getUltimoCierreLabel,
  setCierreConfig,
  isPeriodoCerrado,
  assertPeriodoAbierto,
  assertMovimientoModificable,
  entityBloqueadoPorCierre
};
