import { fusionarRegistroMovimientoEstado } from './entity-crud.util';

type MovimientoMerge = {
  id?: number | string | null;
  estado?: string;
  esAportacionIglesia?: boolean;
  ingresoOrigenId?: number | string;
};

/** Clave estable para fusionar IDs numéricos y legacy `aportacion-{origen}`. */
function claveMovimientoId(id: unknown): string | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  if (Number.isFinite(n) && n > 0) return `n:${n}`;
  const s = String(id);
  if (s.startsWith('aportacion-')) return `s:${s}`;
  return null;
}

function idsLocales<T extends MovimientoMerge>(locales: T[]): Set<string> {
  return new Set(
    locales
      .map(item => claveMovimientoId(item.id))
      .filter((id): id is string => id != null)
  );
}

function esIdLocalPositivo(id: unknown): boolean {
  const n = Number(id);
  return Number.isFinite(n) && n > 0;
}

/** Aportación 33 % recién creada en servidor: el origen ya está en local pero el hijo aún no. */
function esAportacionServidorVinculadaALocal<T extends MovimientoMerge>(
  item: T,
  localIds: Set<string>
): boolean {
  if (!item.esAportacionIglesia || item.ingresoOrigenId == null) return false;
  const origenKey = claveMovimientoId(item.ingresoOrigenId);
  return origenKey != null && localIds.has(origenKey);
}

/** Conserva registros locales recientes si un bootstrap o reload aún no los trae o viene desactualizado. */
export function fusionarMovimientosTrasBootstrap<T extends MovimientoMerge>(
  desdeServidor: T[],
  locales: T[],
  /** IDs borrados en cliente: nunca revivir aunque el bootstrap/API aún los traiga. */
  idsExcluidos?: ReadonlySet<number | string>
): T[] {
  const localIds = idsLocales(locales);
  const excluidos = new Set(
    [...(idsExcluidos ?? [])]
      .map(id => claveMovimientoId(id))
      .filter((id): id is string => id != null)
  );

  const porId = new Map<string, T>();
  for (const item of desdeServidor) {
    if (item.id == null) continue;
    const key = claveMovimientoId(item.id);
    if (key == null) continue;
    if (excluidos.has(key)) continue;
    // No revivir filas que ya no están en local (borrado optimista / caché vieja).
    // Excepción: aportación 33 % generada en servidor vinculada a un origen local.
    if (locales.length > 0 && !localIds.has(key)) {
      if (esAportacionServidorVinculadaALocal(item, localIds)) {
        porId.set(key, item);
      }
      continue;
    }
    porId.set(key, item);
  }
  for (const item of locales) {
    const key = claveMovimientoId(item.id);
    // Conservar aportaciones optimistas (id negativo) solo en local.
    if (key == null) {
      const n = Number(item.id);
      if (Number.isFinite(n) && n < 0) {
        porId.set(`opt:${n}`, item);
      }
      continue;
    }

    const desdeApi = porId.get(key);
    if (!desdeApi) {
      porId.set(key, item);
      continue;
    }
    const numId = esIdLocalPositivo(item.id) ? Number(item.id) : Number.NaN;
    if (Number.isFinite(numId)) {
      porId.set(
        key,
        fusionarRegistroMovimientoEstado(
          desdeApi as { id?: number | null; estado?: string; monto?: number | null },
          item as { id?: number | null; estado?: string; monto?: number | null },
          numId
        ) as T
      );
    } else {
      porId.set(key, { ...desdeApi, ...item, id: item.id ?? desdeApi.id } as T);
    }
  }
  return Array.from(porId.values());
}
