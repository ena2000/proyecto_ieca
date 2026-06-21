import { formatearISOaDDMMYYYY } from './date.util';

export type CampoFechaMovimiento = 'form' | 'desde' | 'hasta';

/** Máscara DD/MM/AAAA sobre dígitos. */
export function formatearEntradaFechaManual(raw: string): string {
  let val = String(raw).replace(/\D/g, '');
  if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
  if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
  return val;
}

/** Convierte DD/MM/AAAA a ISO o null si es inválida. */
export function isoDesdeFechaManualDDMMYYYY(val: string): string | null {
  if (val.length !== 10) return null;
  const parts = val.split('/');
  const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString();
}

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
