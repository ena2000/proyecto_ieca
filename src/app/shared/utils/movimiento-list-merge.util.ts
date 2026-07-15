import { fusionarRegistroMovimientoEstado } from './entity-crud.util';

type MovimientoMerge = {
  id?: number | null;
  estado?: string;
  esAportacionIglesia?: boolean;
  ingresoOrigenId?: number;
};

function idsLocales<T extends MovimientoMerge>(locales: T[]): Set<number> {
  return new Set(
    locales
      .map(item => Number(item.id))
      .filter(id => Number.isFinite(id) && id > 0)
  );
}

/** Aportación 33 % recién creada en servidor: el origen ya está en local pero el hijo aún no. */
function esAportacionServidorVinculadaALocal<T extends MovimientoMerge>(
  item: T,
  localIds: Set<number>
): boolean {
  if (!item.esAportacionIglesia || item.ingresoOrigenId == null) return false;
  const origenId = Number(item.ingresoOrigenId);
  return Number.isFinite(origenId) && origenId > 0 && localIds.has(origenId);
}

/** Conserva registros locales recientes si un bootstrap o reload aún no los trae o viene desactualizado. */
export function fusionarMovimientosTrasBootstrap<T extends MovimientoMerge>(
  desdeServidor: T[],
  locales: T[],
  /** IDs borrados en cliente: nunca revivir aunque el bootstrap/API aún los traiga. */
  idsExcluidos?: ReadonlySet<number>
): T[] {
  const localIds = idsLocales(locales);

  const porId = new Map<number, T>();
  for (const item of desdeServidor) {
    if (item.id == null) continue;
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (idsExcluidos?.has(id)) continue;
    // No revivir filas que ya no están en local (borrado optimista / caché vieja).
    // Excepción: aportación 33 % generada en servidor vinculada a un origen local.
    if (locales.length > 0 && !localIds.has(id)) {
      if (esAportacionServidorVinculadaALocal(item, localIds)) {
        porId.set(id, item);
      }
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
