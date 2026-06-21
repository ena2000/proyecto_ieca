/**
 * Ministerios que pueden existir en BD (p. ej. General para aportación 33 %)
 * pero no deben mostrarse en catálogos operativos.
 *
 * Pendiente: añadir MINISTERIO_IGLESIA_NOMBRE ('General') cuando toque ocultarlo en UI.
 */
export const MINISTERIOS_EXCLUIDOS_CATALOGO: readonly string[] = ['Contabilidad'];

export function esMinisterioExcluidoCatalogo(nombre: string | undefined | null): boolean {
  const n = String(nombre ?? '').trim().toLowerCase();
  if (!n) return false;
  return MINISTERIOS_EXCLUIDOS_CATALOGO.some(ex => ex.toLowerCase() === n);
}

export function filtrarMinisteriosCatalogo<T extends { nombre?: string }>(lista: T[]): T[] {
  return lista.filter(m => !esMinisterioExcluidoCatalogo(m.nombre));
}
