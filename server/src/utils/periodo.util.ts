/** Utilidades puras de periodos contables (sin dependencia de Firestore). */

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function padMesFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getMesActualKey() {
  return padMesFromDate(new Date());
}

function getMesActualLabel() {
  const ahora = new Date();
  return `${MESES_ES[ahora.getMonth()]} ${ahora.getFullYear()}`;
}

function labelToPeriodoKey(label) {
  const parts = String(label ?? '').trim().split(/\s+/);
  if (parts.length < 2) return null;
  const anio = parts[parts.length - 1];
  const mesNombre = parts.slice(0, -1).join(' ');
  const idx = MESES_ES.findIndex(
    (m) => m.toLowerCase() === mesNombre.toLowerCase()
  );
  if (idx < 0 || !/^\d{4}$/.test(anio)) return null;
  return `${anio}-${String(idx + 1).padStart(2, '0')}`;
}

function fechaToPeriodoKey(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return padMesFromDate(d);
}

function etiquetaParaMes(periodoKey) {
  const [anio, mes] = String(periodoKey).split('-');
  const indice = parseInt(mes, 10) - 1;
  if (indice < 0 || indice > 11) return periodoKey;
  return `${MESES_ES[indice]} ${anio}`;
}

function entityBloqueadoPorCierre(entity, cerrados) {
  if (entity?.cerrado === true) return true;
  const key = fechaToPeriodoKey(entity?.fecha);
  return !!(key && cerrados.includes(key));
}

module.exports = {
  MESES_ES,
  padMesFromDate,
  getMesActualKey,
  getMesActualLabel,
  labelToPeriodoKey,
  fechaToPeriodoKey,
  etiquetaParaMes,
  entityBloqueadoPorCierre
};
