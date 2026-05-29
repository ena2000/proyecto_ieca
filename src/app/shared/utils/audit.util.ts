import { AuditoriaMovimiento } from '../../core/models/auditoria.model';

export function stampAuditoriaLocal(
  session: { id?: string; usuario?: string } | null
): Pick<
  AuditoriaMovimiento,
  | 'auditCreadoPorId'
  | 'auditCreadoPorNombre'
  | 'auditCreadoEn'
  | 'auditActualizadoPorId'
  | 'auditActualizadoPorNombre'
  | 'auditActualizadoEn'
> {
  const now = new Date().toISOString();
  const nombre = session?.usuario?.trim() || 'Sistema';
  const id = session?.id != null ? String(session.id) : undefined;
  return {
    auditCreadoPorId: id,
    auditCreadoPorNombre: nombre,
    auditCreadoEn: now,
    auditActualizadoPorId: id,
    auditActualizadoPorNombre: nombre,
    auditActualizadoEn: now
  };
}

export function stampAuditoriaActualizacionLocal(
  item: AuditoriaMovimiento,
  session: { id?: string; usuario?: string } | null
): AuditoriaMovimiento {
  const now = new Date().toISOString();
  const nombre = session?.usuario?.trim() || 'Sistema';
  const id = session?.id != null ? String(session.id) : undefined;
  return {
    ...item,
    auditActualizadoPorId: id,
    auditActualizadoPorNombre: nombre,
    auditActualizadoEn: now
  };
}

export function formatAuditFecha(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function lineaCreadoPor(item: AuditoriaMovimiento & { registradoPor?: string }): string {
  const quien = item.auditCreadoPorNombre?.trim() || item.registradoPor?.trim() || '—';
  const cuando = formatAuditFecha(item.auditCreadoEn);
  return cuando !== '—' ? `${quien} · ${cuando}` : quien;
}

export function lineaModificadoPor(item: AuditoriaMovimiento): string {
  const creado = item.auditCreadoEn;
  const act = item.auditActualizadoEn;
  if (!act || (creado && act === creado && item.auditCreadoPorId === item.auditActualizadoPorId)) {
    return '—';
  }
  const quien = item.auditActualizadoPorNombre?.trim() || '—';
  return `${quien} · ${formatAuditFecha(act)}`;
}
