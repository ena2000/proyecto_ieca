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

/** Sincroniza campos de fecha al elegir fecha nativa (input type="date"). */
export function actualizarDesdeFechaNativa(
  value: string,
  tipo: CampoFechaMovimiento
): ActualizacionFechaNativa | null {
  const yyyyMMdd = String(value || '').trim();
  if (!yyyyMMdd) return null;

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
