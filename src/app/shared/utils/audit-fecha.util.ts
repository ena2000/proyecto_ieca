import { formatearISOaDDMMYYYY } from './date.util';
import {
  formatearEntradaFechaManual,
  isoDesdeFechaManualDDMMYYYY
} from './movimiento-fecha.util';

/** Convierte DD/MM/AAAA a YYYY-MM-DD para filtros de auditoría. */
export function yyyyMmDdDesdeFechaManual(val: string): string | null {
  const iso = isoDesdeFechaManualDDMMYYYY(val);
  if (!iso) return null;
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export interface ActualizacionFechaAuditoria {
  auditDesde?: string;
  auditHasta?: string;
  auditFechaManualDesde?: string;
  auditFechaManualHasta?: string;
}

export function aplicarFechaManualAuditoria(
  raw: string,
  tipo: 'desde' | 'hasta'
): ActualizacionFechaAuditoria {
  const val = formatearEntradaFechaManual(raw);
  if (!val.trim()) {
    return tipo === 'desde'
      ? { auditDesde: '', auditFechaManualDesde: '' }
      : { auditHasta: '', auditFechaManualHasta: '' };
  }
  const ymd = yyyyMmDdDesdeFechaManual(val);
  if (!ymd) {
    return tipo === 'desde'
      ? { auditDesde: '', auditFechaManualDesde: val }
      : { auditHasta: '', auditFechaManualHasta: val };
  }
  return tipo === 'desde'
    ? { auditDesde: ymd, auditFechaManualDesde: val }
    : { auditHasta: ymd, auditFechaManualHasta: val };
}

export function aplicarFechaNativaAuditoria(
  value: string,
  tipo: 'desde' | 'hasta'
): ActualizacionFechaAuditoria {
  const yyyyMMdd = String(value || '').trim();
  if (!yyyyMMdd) {
    return tipo === 'desde'
      ? { auditDesde: '', auditFechaManualDesde: '' }
      : { auditHasta: '', auditFechaManualHasta: '' };
  }
  const iso = new Date(`${yyyyMMdd}T00:00:00`).toISOString();
  const formateada = formatearISOaDDMMYYYY(iso);
  return tipo === 'desde'
    ? { auditDesde: yyyyMMdd, auditFechaManualDesde: formateada }
    : { auditHasta: yyyyMMdd, auditFechaManualHasta: formateada };
}
