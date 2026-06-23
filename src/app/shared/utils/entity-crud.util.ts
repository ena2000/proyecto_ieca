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
