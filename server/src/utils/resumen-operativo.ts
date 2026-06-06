const { listCollection } = require('./firestore');
const { getPeriodosCerrados } = require('./cierre');
const { getMesActualKey, etiquetaParaMes } = require('./periodo.util');

const HORAS_PENDIENTE_DEFAULT = 48;
const DIAS_RECORDATORIO_CIERRE_DEFAULT = 5;

function diasHastaFinDeMes(fecha = new Date()) {
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  return ultimoDia - fecha.getDate();
}

function debeRecordarCierre(diasLimite = DIAS_RECORDATORIO_CIERRE_DEFAULT, fecha = new Date()) {
  return diasHastaFinDeMes(fecha) <= diasLimite;
}

function fechaRegistroMovimiento(entity) {
  return entity?.auditCreadoEn || entity?.fecha || null;
}

function esPendiente(entity) {
  return String(entity?.estado || '').toLowerCase() === 'pendiente';
}

function pendienteAntiguo(entity, horasLimite, ahora = Date.now()) {
  if (!esPendiente(entity)) return false;
  const iso = fechaRegistroMovimiento(entity);
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return ahora - t >= horasLimite * 60 * 60 * 1000;
}

function mapPendiente(tipo, entity, ministeriosPorId) {
  const ministerioId = entity.ministerioId;
  let ministerio = entity.ministerio || 'General';
  if (ministerioId != null && ministeriosPorId.has(Number(ministerioId))) {
    ministerio = ministeriosPorId.get(Number(ministerioId));
  }
  return {
    tipo,
    id: entity.id,
    descripcion: entity.descripcion || entity.tipo || entity.categoria || 'Sin descripción',
    monto: Number(entity.monto) || 0,
    ministerio,
    registradoEn: fechaRegistroMovimiento(entity),
    fechaMovimiento: entity.fecha || null
  };
}

async function listarPendientesAntiguos(horasLimite = HORAS_PENDIENTE_DEFAULT) {
  const [ingresos, gastos, ministerios] = await Promise.all([
    listCollection('ingresos'),
    listCollection('gastos'),
    listCollection('ministerios')
  ]);

  const ministeriosPorId = new Map(
    ministerios.map((m) => [Number(m.id), m.nombre || `Ministerio ${m.id}`])
  );

  const items = [];
  for (const ingreso of ingresos) {
    if (pendienteAntiguo(ingreso, horasLimite)) {
      items.push(mapPendiente('ingreso', ingreso, ministeriosPorId));
    }
  }
  for (const gasto of gastos) {
    if (pendienteAntiguo(gasto, horasLimite)) {
      items.push(mapPendiente('gasto', gasto, ministeriosPorId));
    }
  }

  return items.sort(
    (a, b) => new Date(a.registradoEn).getTime() - new Date(b.registradoEn).getTime()
  );
}

async function evaluarRecordatorioCierre(diasLimite = DIAS_RECORDATORIO_CIERRE_DEFAULT) {
  const mesKey = getMesActualKey();
  const cerrados = await getPeriodosCerrados();
  if (cerrados.includes(mesKey)) {
    return { activo: false, mesKey, etiquetaMes: etiquetaParaMes(mesKey) };
  }
  const diasRestantes = diasHastaFinDeMes();
  const activo = debeRecordarCierre(diasLimite);
  return {
    activo,
    mesKey,
    etiquetaMes: etiquetaParaMes(mesKey),
    diasRestantes,
    diasLimite
  };
}

async function construirResumenOperativo(options: {
  horasPendiente?: number;
  diasRecordatorioCierre?: number;
} = {}) {
  const horas = options.horasPendiente ?? HORAS_PENDIENTE_DEFAULT;
  const diasCierre = options.diasRecordatorioCierre ?? DIAS_RECORDATORIO_CIERRE_DEFAULT;

  const [pendientes, cierre] = await Promise.all([
    listarPendientesAntiguos(horas),
    evaluarRecordatorioCierre(diasCierre)
  ]);

  const tieneContenido = pendientes.length > 0 || cierre.activo;

  return {
    horasPendiente: horas,
    diasRecordatorioCierre: diasCierre,
    pendientes,
    cierre,
    tieneContenido,
    generadoEn: new Date().toISOString()
  };
}

function formatearMontoGtq(monto) {
  return `$ ${Number(monto || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function construirTextoResumen(resumen) {
  const lineas = [
    'Gestión Financiera IECA — Resumen operativo',
    `Generado: ${new Date(resumen.generadoEn).toLocaleString('es-GT')}`,
    ''
  ];

  if (resumen.pendientes.length > 0) {
    lineas.push(
      `Pendientes de aprobación (más de ${resumen.horasPendiente} h): ${resumen.pendientes.length}`,
      ''
    );
    for (const p of resumen.pendientes.slice(0, 25)) {
      lineas.push(
        `• [${p.tipo.toUpperCase()} #${p.id}] ${p.descripcion} — ${formatearMontoGtq(p.monto)} (${p.ministerio})`
      );
    }
    if (resumen.pendientes.length > 25) {
      lineas.push(`… y ${resumen.pendientes.length - 25} más en la aplicación.`);
    }
    lineas.push('');
  }

  if (resumen.cierre.activo) {
    lineas.push(
      `Recordatorio de cierre mensual: ${resumen.cierre.etiquetaMes}`,
      `Quedan ${resumen.cierre.diasRestantes} día(s) de calendario en el mes.`,
      'Ejecuta el cierre en Administración cuando los movimientos del mes estén revisados.',
      ''
    );
  }

  if (!resumen.tieneContenido) {
    lineas.push('No hay alertas operativas en este momento.');
  }

  lineas.push('', '— Iglesia del Evangelio Cuadrangular "La Alborada" (IECA)');
  return lineas.join('\n');
}

function construirAsuntoResumen(resumen) {
  const partes = [];
  if (resumen.pendientes.length > 0) {
    partes.push(`${resumen.pendientes.length} pendiente(s)`);
  }
  if (resumen.cierre.activo) {
    partes.push(`cierre ${resumen.cierre.etiquetaMes}`);
  }
  if (!partes.length) {
    return 'IECA — Sin alertas operativas';
  }
  return `IECA — ${partes.join(' · ')}`;
}

module.exports = {
  HORAS_PENDIENTE_DEFAULT,
  DIAS_RECORDATORIO_CIERRE_DEFAULT,
  diasHastaFinDeMes,
  debeRecordarCierre,
  pendienteAntiguo,
  listarPendientesAntiguos,
  evaluarRecordatorioCierre,
  construirResumenOperativo,
  construirTextoResumen,
  construirAsuntoResumen,
  formatearMontoGtq
};
