import { Ministerio } from '../../core/models';

export function ministeriosEnAlcance(
  lista: Ministerio[],
  ministerioScopeId: number | null
): Ministerio[] {
  if (ministerioScopeId == null) return lista;
  return lista.filter(m => Number(m.id) === ministerioScopeId);
}

export function perteneceAlcanceMinisterio(
  item: { ministerioId?: number },
  ministerioScopeId: number | null
): boolean {
  if (ministerioScopeId == null) return true;
  return Number(item.ministerioId) === ministerioScopeId;
}

export function aplicarMinisterioAlMovimiento<T extends { ministerioId?: number; ministerio?: string }>(
  movimiento: T,
  listaMinisterios: Ministerio[],
  ministerioScopeId: number | null
): T {
  if (ministerioScopeId == null) return movimiento;
  const min = listaMinisterios.find(m => Number(m.id) === ministerioScopeId);
  const actualizado = { ...movimiento, ministerioId: ministerioScopeId };
  if (min?.nombre) {
    actualizado.ministerio = min.nombre;
  }
  return actualizado;
}
