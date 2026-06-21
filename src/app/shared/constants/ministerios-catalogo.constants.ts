import { MINISTERIO_IGLESIA_NOMBRE } from './aportacion-iglesia.constants';

/**
 * Ministerios que no son áreas operativas (p. ej. Contabilidad).
 * General NO va aquí: se muestra en reportes pero no en formularios manuales.
 */
export const MINISTERIOS_EXCLUIDOS_CATALOGO: readonly string[] = ['Contabilidad'];

export function esMinisterioExcluidoCatalogo(nombre: string | undefined | null): boolean {
  const n = String(nombre ?? '').trim().toLowerCase();
  if (!n) return false;
  return MINISTERIOS_EXCLUIDOS_CATALOGO.some(ex => ex.toLowerCase() === n);
}

export function esMinisterioIglesiaGeneral(nombre: string | undefined | null): boolean {
  return String(nombre ?? '').trim().toLowerCase() === MINISTERIO_IGLESIA_NOMBRE.toLowerCase();
}

/** Formularios, usuarios y asignaciones: sin Contabilidad ni General. */
export function filtrarMinisteriosRegistroManual<T extends { nombre?: string }>(lista: T[]): T[] {
  return filtrarMinisteriosCatalogo(lista).filter(m => !esMinisterioIglesiaGeneral(m.nombre));
}

/** Reportes y gráficos: incluye General (aportación 33 %), sin Contabilidad. */
export function filtrarMinisteriosReportes<T extends { nombre?: string }>(lista: T[]): T[] {
  return filtrarMinisteriosCatalogo(lista);
}

export function filtrarMinisteriosCatalogo<T extends { nombre?: string }>(lista: T[]): T[] {
  return lista.filter(m => !esMinisterioExcluidoCatalogo(m.nombre));
}
