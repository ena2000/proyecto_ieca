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

async function assertFechaNoFutura(fecha, fechaFormateada) {
  let ymd = null;
  const formateada = String(fechaFormateada ?? '').trim();
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formateada);
  if (dmy) {
    ymd = `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  } else {
    const raw = String(fecha ?? '').trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (iso) {
      ymd = `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
  }
  if (!ymd) return;

  // Zona típica Centroamérica (evita falsos positivos por UTC en Render).
  const tz = process.env.APP_TIMEZONE || 'America/Costa_Rica';
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  if (ymd > hoy) {
    const err = new Error('La fecha no puede ser posterior a hoy.');
    err.status = 400;
    throw err;
  }
}

async function assertPeriodoAbierto(fecha, fechaFormateada) {
  await assertFechaNoFutura(fecha, fechaFormateada);
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
  assertFechaNoFutura,
  assertMovimientoModificable,
  entityBloqueadoPorCierre
};
