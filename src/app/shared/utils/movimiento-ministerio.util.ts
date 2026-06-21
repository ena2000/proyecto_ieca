import { Ministerio } from '../../core/models';
import { MINISTERIO_IGLESIA_NOMBRE } from '../constants/aportacion-iglesia.constants';
import { filtrarMinisteriosRegistroManual } from '../constants/ministerios-catalogo.constants';

/** Resuelve el nombre visible del ministerio; el catálogo por id tiene prioridad sobre texto guardado. */
export function resolverNombreMinisterio(
  ministerioId: number | string | undefined | null,
  ministerioGuardado: string | undefined,
  ministerios: Pick<Ministerio, 'id' | 'nombre'>[],
  opciones?: { esAportacionIglesia?: boolean }
): string {
  if (opciones?.esAportacionIglesia) {
    return MINISTERIO_IGLESIA_NOMBRE;
  }

  if (ministerioId != null && ministerioId !== '') {
    const id = Number(ministerioId);
    if (Number.isFinite(id)) {
      const m = ministerios.find(x => Number(x.id) === id);
      if (m?.nombre?.trim()) return m.nombre.trim();
    }
  }

  const guardado = ministerioGuardado?.trim();
  if (guardado && guardado !== MINISTERIO_IGLESIA_NOMBRE) {
    return guardado;
  }

  return MINISTERIO_IGLESIA_NOMBRE;
}

export function ministeriosEnAlcance(
  lista: Ministerio[],
  ministerioScopeId: number | null
): Ministerio[] {
  if (ministerioScopeId != null) {
    return lista.filter(m => Number(m.id) === ministerioScopeId);
  }
  return filtrarMinisteriosRegistroManual(lista);
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
  if (ministerioScopeId == null) {
    return sincronizarNombreMinisterioEnMovimiento(movimiento, listaMinisterios);
  }
  const min = listaMinisterios.find(m => Number(m.id) === ministerioScopeId);
  const actualizado = { ...movimiento, ministerioId: ministerioScopeId };
  if (min?.nombre) {
    actualizado.ministerio = min.nombre;
  }
  return actualizado;
}

/** Sincroniza el nombre del ministerio cuando el formulario tiene ministerioId pero el texto quedó en "General". */
export function sincronizarNombreMinisterioEnMovimiento<T extends { ministerioId?: number; ministerio?: string }>(
  movimiento: T,
  listaMinisterios: Ministerio[]
): T {
  if (movimiento.ministerioId == null) return movimiento;
  const id = Number(movimiento.ministerioId);
  const min = listaMinisterios.find(m => Number(m.id) === id);
  if (!min?.nombre) return movimiento;
  return { ...movimiento, ministerioId: id, ministerio: min.nombre };
}
