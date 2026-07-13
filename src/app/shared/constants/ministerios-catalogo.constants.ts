import { MINISTERIO_IGLESIA_NOMBRE } from './aportacion-iglesia.constants';

/**
 * Ministerios que no son áreas operativas (p. ej. Contabilidad).
 * General NO va aquí: se muestra en reportes (aportación 33 %) pero no en
 * formularios ni filtros de ingresos/gastos (P-02).
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

/** Id del ministerio «General» en catálogo (fondo iglesia / aportación 33 %). */
export function idMinisterioIglesiaGeneral(
  ministerios: ReadonlyArray<{ id: number; nombre?: string }>
): number | undefined {
  const m = ministerios.find(x => esMinisterioIglesiaGeneral(x.nombre));
  return m?.id;
}

export function esIdMinisterioIglesiaGeneral(
  ministerioId: number,
  ministerios: ReadonlyArray<{ id: number; nombre?: string }>
): boolean {
  const idGeneral = idMinisterioIglesiaGeneral(ministerios);
  return idGeneral != null && Number(ministerioId) === Number(idGeneral);
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
