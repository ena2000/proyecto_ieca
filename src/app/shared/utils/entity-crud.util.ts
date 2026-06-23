/** Utilidades compartidas para listas CRUD (ingresos, gastos, usuarios, ministerios). */

export function completarRegistroTrasMutacion<T extends { id?: number | null }>(
  desdeApi: T,
  enviado: Partial<T>,
  idFallback?: number
): T {
  return {
    ...enviado,
    ...desdeApi,
    id: desdeApi.id ?? idFallback
  } as T;
}

/** Inserta o reemplaza por id al inicio de la lista (fila visible al instante tras crear). */
export function prependRegistroUnico<T extends { id?: number | null }>(
  registro: T,
  lista: T[]
): T[] {
  const id = Number(registro.id);
  if (!Number.isFinite(id) || id <= 0) {
    return [registro, ...lista];
  }
  return [registro, ...lista.filter(x => Number(x.id) !== id)];
}

/** Reemplaza un registro por id (comparación numérica). */
export function reemplazarRegistroEnLista<T extends { id?: number | null }>(
  lista: T[],
  id: number,
  registro: T
): T[] {
  const numId = Number(id);
  return lista.map(item => (Number(item.id) === numId ? registro : item));
}

const RANK_ESTADO_MOVIMIENTO: Record<string, number> = {
  pendiente: 1,
  rechazado: 2,
  aprobado: 3
};

function rankEstadoMovimiento(estado: unknown): number {
  const key = String(estado ?? '').trim().toLowerCase();
  return RANK_ESTADO_MOVIMIENTO[key] ?? 0;
}

/** Tras aprobar/rechazar, fusiona API + fila local sin perder el estado más avanzado. */
export function fusionarRegistroMovimientoEstado<T extends { id?: number | null; estado?: string }>(
  desdeApi: T,
  local: T | undefined,
  idFallback?: number
): T {
  const base = completarRegistroTrasMutacion(desdeApi, local ?? {}, idFallback);
  if (!local) return base;

  const rLocal = rankEstadoMovimiento(local.estado);
  const rApi = rankEstadoMovimiento(desdeApi.estado);
  if (rLocal > rApi) {
    return { ...base, ...local, estado: local.estado, id: base.id ?? local.id };
  }
  return base;
}
