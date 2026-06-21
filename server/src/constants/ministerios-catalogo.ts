/** Ministerios excluidos del catálogo operativo (no son áreas de trabajo financiero). */
const MINISTERIOS_EXCLUIDOS_CATALOGO = ['Contabilidad'];

function esMinisterioExcluidoCatalogo(nombre: unknown): boolean {
  const n = String(nombre ?? '').trim().toLowerCase();
  if (!n) return false;
  return MINISTERIOS_EXCLUIDOS_CATALOGO.some(ex => ex.toLowerCase() === n);
}

function filtrarMinisteriosCatalogo<T extends { nombre?: string }>(lista: T[]): T[] {
  return lista.filter(m => !esMinisterioExcluidoCatalogo(m.nombre));
}

module.exports = {
  MINISTERIOS_EXCLUIDOS_CATALOGO,
  esMinisterioExcluidoCatalogo,
  filtrarMinisteriosCatalogo
};
