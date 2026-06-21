import { formatearISOaDDMMYYYY } from './date.util';
import {
  formatearEntradaFechaManual,
  isoDesdeFechaManualDDMMYYYY,
  mensajeRangoFiltroFechaInvalido,
  rangoFechasFiltroInvalido
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

export interface EstadoFiltroFechaAuditoria {
  auditDesde: string;
  auditHasta: string;
  auditFechaManualDesde: string;
  auditFechaManualHasta: string;
}

export type ResultadoActualizarFiltroFechaAuditoria =
  | { ok: true; estado: EstadoFiltroFechaAuditoria; resetNativo: 'desde' | 'hasta' | null }
  | {
      ok: false;
      mensaje: string;
      estado: EstadoFiltroFechaAuditoria;
      resetNativo: 'desde' | 'hasta';
    };

function limpiarCampoFechaAuditoria(
  tipo: 'desde' | 'hasta'
): Partial<EstadoFiltroFechaAuditoria> {
  return tipo === 'desde'
    ? { auditDesde: '', auditFechaManualDesde: '' }
    : { auditHasta: '', auditFechaManualHasta: '' };
}

export function actualizarEstadoFiltroFechaAuditoria(
  tipo: 'desde' | 'hasta',
  upd: Partial<EstadoFiltroFechaAuditoria>,
  actual: EstadoFiltroFechaAuditoria
): ResultadoActualizarFiltroFechaAuditoria {
  const estado: EstadoFiltroFechaAuditoria = {
    auditDesde: upd.auditDesde !== undefined ? upd.auditDesde : actual.auditDesde,
    auditHasta: upd.auditHasta !== undefined ? upd.auditHasta : actual.auditHasta,
    auditFechaManualDesde:
      upd.auditFechaManualDesde !== undefined ? upd.auditFechaManualDesde : actual.auditFechaManualDesde,
    auditFechaManualHasta:
      upd.auditFechaManualHasta !== undefined ? upd.auditFechaManualHasta : actual.auditFechaManualHasta
  };

  if (!estado.auditDesde || !estado.auditHasta) {
    const resetNativo =
      (tipo === 'desde' && !estado.auditDesde) || (tipo === 'hasta' && !estado.auditHasta)
        ? tipo
        : null;
    return { ok: true, estado, resetNativo };
  }

  if (rangoFechasFiltroInvalido(estado.auditDesde, estado.auditHasta)) {
    return {
      ok: false,
      mensaje: mensajeRangoFiltroFechaInvalido(tipo),
      estado: { ...estado, ...limpiarCampoFechaAuditoria(tipo) },
      resetNativo: tipo
    };
  }

  return { ok: true, estado, resetNativo: null };
}
