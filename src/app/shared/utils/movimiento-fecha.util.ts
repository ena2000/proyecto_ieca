export type CampoFechaMovimiento = 'form' | 'desde' | 'hasta';

/** Máscara DD/MM/AAAA sobre dígitos (máx. 8 dígitos = día+mes+año). */
export function formatearEntradaFechaManual(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';

  // Ya está en DD/MM/AAAA (completo o parcial con barras).
  if (/^\d{1,2}(\/\d{0,2}(\/\d{0,4})?)?$/.test(s)) {
    const digits = s.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  // ISO o YYYY-MM-DD: convertir a calendario local, no enmascarar dígitos crudos.
  const ymd = yyyyMmDdDesdeValorFecha(s);
  if (ymd) {
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }

  const digits = s.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Convierte DD/MM/AAAA a ISO (mediodía local) o null si es inválida. */
export function isoDesdeFechaManualDDMMYYYY(val: string): string | null {
  if (!esFechaCalendarioValidaDDMMYYYY(val)) return null;
  const parts = val.split('/');
  const yyyy = Number(parts[2]);
  const mm = Number(parts[1]);
  const dd = Number(parts[0]);
  return fechaIsoMediodiaLocal(yyyy, mm, dd);
}

/** ISO estable a mediodía local (evita que UTC cambie el día calendario). */
export function fechaIsoMediodiaLocal(yyyy: number, mm: number, dd: number): string {
  return new Date(yyyy, mm - 1, dd, 12, 0, 0).toISOString();
}

/** Hoy (calendario local) como ISO a mediodía. */
export function fechaIsoHoyLocal(hoy: Date = new Date()): string {
  return fechaIsoMediodiaLocal(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
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

  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMMdd);
  if (!ymd) return limpiarActualizacionFechaNativa(tipo);

  const yyyy = Number(ymd[1]);
  const mm = Number(ymd[2]);
  const dd = Number(ymd[3]);
  const iso = fechaIsoMediodiaLocal(yyyy, mm, dd);
  // DD/MM desde el valor del picker (no desde UTC del ISO).
  const formateada = `${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yyyy}`;

  if (tipo === 'form') {
    return { fechaIso: iso, fechaManualForm: formateada };
  }
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
