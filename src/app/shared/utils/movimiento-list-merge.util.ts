import { fusionarRegistroMovimientoEstado } from './entity-crud.util';

/** Conserva registros locales recientes si un bootstrap o reload aún no los trae o viene desactualizado. */
export function fusionarMovimientosTrasBootstrap<T extends { id?: number | null; estado?: string }>(
  desdeServidor: T[],
  locales: T[]
): T[] {
  const localIds = new Set(
    locales
      .map(item => Number(item.id))
      .filter(id => Number.isFinite(id) && id > 0)
  );
  const hayIdsNuevosSoloEnLocal = locales.some(
    item => item.id != null && !desdeServidor.some(s => Number(s.id) === Number(item.id))
  );

  const porId = new Map<number, T>();
  for (const item of desdeServidor) {
    if (item.id == null) continue;
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    // Tras eliminar localmente, no revivir filas que el servidor aún devuelve por caché/latencia.
    if (locales.length > 0 && !hayIdsNuevosSoloEnLocal && !localIds.has(id)) {
      continue;
    }
    porId.set(id, item);
  }
  for (const item of locales) {
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) continue;

    const desdeApi = porId.get(id);
    if (!desdeApi) {
      porId.set(id, item);
      continue;
    }
    porId.set(id, fusionarRegistroMovimientoEstado(desdeApi, item, id));
  }
  return Array.from(porId.values());
}
