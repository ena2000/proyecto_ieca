import { Usuario } from '../../core/models';
import { formatearISOaDDMMYYYY } from './date.util';

export const AUDITORIA_CSV_HEADERS = [
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
] as const;

export function formatSoloHoraDesdeIso(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatFechaFormateadaMovimiento(entity: {
  fecha?: string;
  fechaFormateada?: string;
  auditCreadoEn?: string;
}): string {
  const dia =
    entity.fechaFormateada?.trim() ||
    (entity.fecha ? formatearISOaDDMMYYYY(entity.fecha) : '');

  const hora =
    formatSoloHoraDesdeIso(entity.auditCreadoEn) ||
    formatSoloHoraDesdeIso(entity.fecha);

  if (dia && hora) return `${dia} ${hora}`;

  if (entity.fecha) {
    const completa = formatFechaHoraAuditoria(entity.fecha);
    if (completa) return completa;
  }

  return dia;
}

export function parseFechaCsvParaOrden(valor?: string | null): number {
  if (!valor) return 0;
  const m = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!m) return 0;
  const [, dd, mm, yyyy, hh = '0', min = '0'] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function formatFechaHoraAuditoria(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function buildMapaNombresUsuarios(usuarios: Usuario[]): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const u of usuarios) {
    const id = String(u.id);
    const nombre = (u.nombre ?? u.usuario ?? '').trim();
    if (nombre) mapa.set(id, nombre);
  }
  return mapa;
}

export function formatActorAuditoria(
  valor?: string | number | null,
  mapaUsuarios?: Map<string, string>
): string {
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

export function mapMovimientoAuditoriaCsvRow(
  entity: Record<string, unknown>,
  tipo: 'ingreso' | 'gasto',
  mapaUsuarios: Map<string, string>
): Record<string, string | number | undefined | null> {
  return {
    tipo,
    id: entity['id'] as number | undefined,
    fechaFormateada: formatFechaFormateadaMovimiento({
      fecha: entity['fecha'] as string | undefined,
      fechaFormateada: entity['fechaFormateada'] as string | undefined,
      auditCreadoEn: entity['auditCreadoEn'] as string | undefined
    }),
    ministerio: entity['ministerio'] as string | undefined,
    ministerioId: entity['ministerioId'] as number | undefined,
    descripcion: entity['descripcion'] as string | undefined,
    monto: entity['monto'] as number | undefined,
    estado: entity['estado'] as string | undefined,
    auditCreadoPorId: entity['auditCreadoPorId'] as string | undefined,
    auditCreadoPorNombre: entity['auditCreadoPorNombre'] as string | undefined,
    auditCreadoEn: formatFechaHoraAuditoria(entity['auditCreadoEn'] as string | undefined),
    auditActualizadoPorId: entity['auditActualizadoPorId'] as string | undefined,
    auditActualizadoPorNombre: entity['auditActualizadoPorNombre'] as string | undefined,
    auditActualizadoEn: formatFechaHoraAuditoria(entity['auditActualizadoEn'] as string | undefined),
    aprobadoPor: formatActorAuditoria(entity['aprobadoPor'] as string | number | undefined, mapaUsuarios),
    fechaAprobacion: formatFechaHoraAuditoria(entity['fechaAprobacion'] as string | undefined),
    rechazadoPor: formatActorAuditoria(entity['rechazadoPor'] as string | number | undefined, mapaUsuarios),
    fechaRechazo: formatFechaHoraAuditoria(entity['fechaRechazo'] as string | undefined),
    motivoRechazo: entity['motivoRechazo'] as string | undefined
  };
}
