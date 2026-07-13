import { formatearISOaDDMMYYYY } from './date.util';

export type CampoFechaMovimiento = 'form' | 'desde' | 'hasta';

/** Máscara DD/MM/AAAA sobre dígitos. */
export function formatearEntradaFechaManual(raw: string): string {
  let val = String(raw).replace(/\D/g, '');
  if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
  if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
  return val;
}

/** Convierte DD/MM/AAAA a ISO o null si es inválida (incluye día/mes inexistentes). */
export function isoDesdeFechaManualDDMMYYYY(val: string): string | null {
  if (!esFechaCalendarioValidaDDMMYYYY(val)) return null;
  const parts = val.split('/');
  const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  return dateObj.toISOString();
}

/** True si DD/MM/AAAA es un día de calendario real (rechaza 31/02, etc.). */
export function esFechaCalendarioValidaDDMMYYYY(val: string): boolean {
  if (String(val || '').length !== 10) return false;
  const parts = val.split('/');
  if (parts.length !== 3) return false;
  const dd = Number(parts[0]);
  const mm = Number(parts[1]);
  const yyyy = Number(parts[2]);
  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) return false;
  if (yyyy < 2000 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

export const MENSAJE_FECHA_CALENDARIO_INVALIDA =
  'La fecha no es válida (revisa día y mes).';


/** Fecha local de hoy como YYYY-MM-DD (para `max` del input date). */
export function hoyLocalYYYYMMDD(hoy: Date = new Date()): string {
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Extrae YYYY-MM-DD desde ISO, YYYY-MM-DD o DD/MM/AAAA. */
export function yyyyMmDdDesdeValorFecha(valor?: string | null): string | null {
  const raw = String(valor ?? '').trim();
  if (!raw) return null;

  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (ymd) {
    return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return hoyLocalYYYYMMDD(d);
}

/** True si la fecha del movimiento es posterior a hoy (día local). */
export function esFechaMovimientoFutura(
  fechaManual?: string | null,
  fechaIso?: string | null,
  hoy: Date = new Date()
): boolean {
  const ymd =
    yyyyMmDdDesdeValorFecha(fechaManual) ?? yyyyMmDdDesdeValorFecha(fechaIso);
  if (!ymd) return false;
  return ymd > hoyLocalYYYYMMDD(hoy);
}

export const MENSAJE_FECHA_MOVIMIENTO_FUTURA =
  'La fecha no puede ser posterior a hoy.';

export interface ActualizacionFechaNativa {
  fechaManualForm?: string;
  fechaManualDesde?: string;
  fechaManualHasta?: string;
  filtroFechaInicio?: string;
  filtroFechaFin?: string;
  fechaIso?: string;
}

/** Limpia campos de fecha (selector nativo o botón «Limpiar filtros»). */
export function limpiarActualizacionFechaNativa(
  tipo: CampoFechaMovimiento
): ActualizacionFechaNativa {
  if (tipo === 'form') {
    return { fechaManualForm: '' };
  }
  if (tipo === 'desde') {
    return { filtroFechaInicio: '', fechaManualDesde: '' };
  }
  return { filtroFechaFin: '', fechaManualHasta: '' };
}

/** Sincroniza campos de fecha al elegir o borrar en input type="date". */
export function actualizarDesdeFechaNativa(
  value: string,
  tipo: CampoFechaMovimiento
): ActualizacionFechaNativa {
  const yyyyMMdd = String(value || '').trim();
  if (!yyyyMMdd) return limpiarActualizacionFechaNativa(tipo);

  const iso = new Date(`${yyyyMMdd}T00:00:00`).toISOString();
  if (tipo === 'form') {
    return { fechaIso: iso, fechaManualForm: formatearISOaDDMMYYYY(iso) };
  }

  const formateada = formatearISOaDDMMYYYY(iso);
  if (tipo === 'desde') {
    return { filtroFechaInicio: iso, fechaManualDesde: formateada };
  }
  return { filtroFechaFin: iso, fechaManualHasta: formateada };
}

/** Sincroniza filtros «desde/hasta» al escribir DD/MM/AAAA manualmente. */
export function aplicarFechaManualFiltro(
  raw: string,
  tipo: 'desde' | 'hasta'
): Pick<
  ActualizacionFechaNativa,
  'filtroFechaInicio' | 'filtroFechaFin' | 'fechaManualDesde' | 'fechaManualHasta'
> {
  const val = formatearEntradaFechaManual(raw);
  const iso = isoDesdeFechaManualDDMMYYYY(val);
  if (tipo === 'desde') {
    return { fechaManualDesde: val, filtroFechaInicio: iso ?? '' };
  }
  return { fechaManualHasta: val, filtroFechaFin: iso ?? '' };
}

export function estadoFiltrosFechaMovimientoVacios(): {
  filtroFechaInicio: string;
  filtroFechaFin: string;
  fechaManualDesde: string;
  fechaManualHasta: string;
} {
  return {
    filtroFechaInicio: '',
    filtroFechaFin: '',
    fechaManualDesde: '',
    fechaManualHasta: ''
  };
}

export interface EstadoFiltroFechaMovimiento {
  filtroFechaInicio: string;
  filtroFechaFin: string;
  fechaManualDesde: string;
  fechaManualHasta: string;
}

/** Inicio de día local en ms; acepta ISO o YYYY-MM-DD. */
export function fechaDiaMs(valor: string): number | null {
  const raw = String(valor || '').trim();
  if (!raw) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function rangoFechasFiltroInvalido(desdeIso: string, hastaIso: string): boolean {
  const desde = fechaDiaMs(desdeIso);
  const hasta = fechaDiaMs(hastaIso);
  if (desde == null || hasta == null) return false;
  return hasta < desde;
}

export function mensajeRangoFiltroFechaInvalido(tipo: 'desde' | 'hasta'): string {
  return tipo === 'hasta'
    ? 'La fecha «Hasta» no puede ser anterior a «Desde la fecha».'
    : 'La fecha «Desde» no puede ser posterior a «Hasta la fecha».';
}

export function limpiarCampoFiltroFecha(
  tipo: 'desde' | 'hasta'
): Partial<EstadoFiltroFechaMovimiento> {
  return tipo === 'desde'
    ? { filtroFechaInicio: '', fechaManualDesde: '' }
    : { filtroFechaFin: '', fechaManualHasta: '' };
}

export type ResultadoActualizarFiltroFechaMovimiento =
  | { ok: true; estado: EstadoFiltroFechaMovimiento; resetNativo: 'desde' | 'hasta' | null }
  | {
      ok: false;
      mensaje: string;
      estado: EstadoFiltroFechaMovimiento;
      resetNativo: 'desde' | 'hasta';
    };

/** Fusiona cambio de filtro y valida que «desde» ≤ «hasta». */
export function actualizarEstadoFiltroFechaMovimiento(
  tipo: 'desde' | 'hasta',
  upd: Partial<EstadoFiltroFechaMovimiento>,
  actual: EstadoFiltroFechaMovimiento
): ResultadoActualizarFiltroFechaMovimiento {
  const estado: EstadoFiltroFechaMovimiento = {
    filtroFechaInicio:
      upd.filtroFechaInicio !== undefined ? upd.filtroFechaInicio : actual.filtroFechaInicio,
    filtroFechaFin:
      upd.filtroFechaFin !== undefined ? upd.filtroFechaFin : actual.filtroFechaFin,
    fechaManualDesde:
      upd.fechaManualDesde !== undefined ? upd.fechaManualDesde : actual.fechaManualDesde,
    fechaManualHasta:
      upd.fechaManualHasta !== undefined ? upd.fechaManualHasta : actual.fechaManualHasta
  };

  if (!estado.filtroFechaInicio || !estado.filtroFechaFin) {
    const resetNativo =
      (tipo === 'desde' && !estado.filtroFechaInicio) ||
      (tipo === 'hasta' && !estado.filtroFechaFin)
        ? tipo
        : null;
    return { ok: true, estado, resetNativo };
  }

  if (rangoFechasFiltroInvalido(estado.filtroFechaInicio, estado.filtroFechaFin)) {
    return {
      ok: false,
      mensaje: mensajeRangoFiltroFechaInvalido(tipo),
      estado: { ...estado, ...limpiarCampoFiltroFecha(tipo) },
      resetNativo: tipo
    };
  }

  return { ok: true, estado, resetNativo: null };
}
