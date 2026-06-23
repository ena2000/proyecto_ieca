/** Conserva registros recién creados en cliente si un bootstrap viejo aún no los trae. */
export function fusionarMovimientosTrasBootstrap<T extends { id?: number | null }>(
  desdeServidor: T[],
  locales: T[]
): T[] {
  const porId = new Map<number, T>();
  for (const item of desdeServidor) {
    if (item.id != null) {
      porId.set(Number(item.id), item);
    }
  }
  for (const item of locales) {
    const id = Number(item.id);
    if (Number.isFinite(id) && id > 0 && !porId.has(id)) {
      porId.set(id, item);
    }
  }
  return Array.from(porId.values());
}
