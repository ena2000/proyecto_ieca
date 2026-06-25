const { formatDateDDMMYYYY } = require('./firestore');

const AUDITORIA_CSV_HEADERS = [
  'tipo',
  'id',
  'fechaFormateada',
  'ministerio',
  'ministerioId',
  'descripcion',
  'monto',
  'estado',
  'auditCreadoPorId',
  'auditCreadoPorNombre',
  'auditCreadoEn',
  'auditActualizadoPorId',
  'auditActualizadoPorNombre',
  'auditActualizadoEn',
  'aprobadoPor',
  'fechaAprobacion',
  'rechazadoPor',
  'fechaRechazo',
  'motivoRechazo'
];

function formatFechaFormateadaMovimiento(entity) {
  const ff = entity?.fechaFormateada?.trim?.() ?? String(entity?.fechaFormateada ?? '').trim();
  if (ff) return ff;
  if (entity?.fecha) return formatDateDDMMYYYY(entity.fecha);
  return '';
}

function formatFechaHoraAuditoria(iso) {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function buildMapaNombresUsuarios(usuarios) {
  const mapa = new Map();
  for (const u of usuarios) {
    if (u?.id == null) continue;
    const id = String(u.id);
    const nombre = String(u.nombre ?? u.usuario ?? '').trim();
    if (nombre) mapa.set(id, nombre);
  }
  return mapa;
}

function formatActorAuditoria(valor, mapaUsuarios) {
  if (valor == null || valor === '') return '';
  const raw = String(valor).trim();
  if (!raw) return '';

  if (/^\d+$/.test(raw)) {
    const nombre = mapaUsuarios?.get(raw);
    if (nombre) return `${nombre} (#${raw})`;
    return `#${raw}`;
  }

  return raw;
}

function mapMovimientoAuditoriaCsvRow(entity, tipo, mapaUsuarios) {
  return {
    tipo,
    id: entity.id,
    fechaFormateada: formatFechaFormateadaMovimiento(entity),
    ministerio: entity.ministerio,
    ministerioId: entity.ministerioId,
    descripcion: entity.descripcion,
    monto: entity.monto,
    estado: entity.estado,
    auditCreadoPorId: entity.auditCreadoPorId,
    auditCreadoPorNombre: entity.auditCreadoPorNombre,
    auditCreadoEn: formatFechaHoraAuditoria(entity.auditCreadoEn),
    auditActualizadoPorId: entity.auditActualizadoPorId,
    auditActualizadoPorNombre: entity.auditActualizadoPorNombre,
    auditActualizadoEn: formatFechaHoraAuditoria(entity.auditActualizadoEn),
    aprobadoPor: formatActorAuditoria(entity.aprobadoPor, mapaUsuarios),
    fechaAprobacion: formatFechaHoraAuditoria(entity.fechaAprobacion),
    rechazadoPor: formatActorAuditoria(entity.rechazadoPor, mapaUsuarios),
    fechaRechazo: formatFechaHoraAuditoria(entity.fechaRechazo),
    motivoRechazo: entity.motivoRechazo
  };
}

module.exports = {
  AUDITORIA_CSV_HEADERS,
  formatFechaFormateadaMovimiento,
  formatFechaHoraAuditoria,
  buildMapaNombresUsuarios,
  formatActorAuditoria,
  mapMovimientoAuditoriaCsvRow
};
