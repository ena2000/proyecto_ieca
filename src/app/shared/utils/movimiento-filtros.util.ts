export type MovimientoEstadoFiltro = 'pendiente' | 'aprobado' | 'rechazado';
export type FiltroEstadoMovimiento = 'todos' | MovimientoEstadoFiltro;

export const FILTRO_ESTADO_MOVIMIENTO_TODOS: FiltroEstadoMovimiento = 'todos';

export interface FiltrosMovimiento {
  searchTerm: string;
  filtroFechaInicio: string;
  filtroFechaFin: string;
  fechaManualDesde: string;
  fechaManualHasta: string;
  filtroMontoMin: number | null;
  filtroMontoMax: number | null;
  filtroEstado: FiltroEstadoMovimiento;
  filtroMinisterioId: number | null;
}

export function hayFiltrosMovimientoAvanzadosActivos(f: FiltrosMovimiento): boolean {
  return !!(
    f.filtroFechaInicio ||
    f.filtroFechaFin ||
    f.fechaManualDesde ||
    f.fechaManualHasta ||
    f.filtroMontoMin !== null ||
    f.filtroMontoMax !== null
  );
}

export function hayFiltrosMovimientoActivos(f: FiltrosMovimiento): boolean {
  return !!(
    f.searchTerm ||
    hayFiltrosMovimientoAvanzadosActivos(f) ||
    f.filtroEstado !== FILTRO_ESTADO_MOVIMIENTO_TODOS ||
    f.filtroMinisterioId != null
  );
}

export interface FiltrarMovimientosConfig<T> {
  items: T[];
  ministerioScopeId: number | null;
  filtros: FiltrosMovimiento;
  textoBusqueda: (item: T) => string[];
  resolverEstado: (item: T) => MovimientoEstadoFiltro;
  enriquecer: (item: T) => T;
}

export function itemsEnAlcanceMinisterio<T extends { ministerioId?: number }>(
  items: T[],
  ministerioScopeId: number | null,
  filtroMinisterioId: number | null
): T[] {
  if (ministerioScopeId != null) {
    return items.filter(i => Number(i.ministerioId) === ministerioScopeId);
  }
  if (filtroMinisterioId != null) {
    return items.filter(i => Number(i.ministerioId) === filtroMinisterioId);
  }
  return items;
}

export function filtrarMovimientos<T extends { fecha: string; monto?: number | null; ministerioId?: number }>(
  config: FiltrarMovimientosConfig<T>
): T[] {
  let filtrados = itemsEnAlcanceMinisterio(
    config.items,
    config.ministerioScopeId,
    config.filtros.filtroMinisterioId
  );

  if (config.filtros.searchTerm) {
    const search = config.filtros.searchTerm.toLowerCase();
    filtrados = filtrados.filter(i =>
      config.textoBusqueda(i).some(t => t?.toLowerCase().includes(search))
    );
  }

  if (config.filtros.filtroFechaInicio) {
    const inicio = new Date(config.filtros.filtroFechaInicio).setHours(0, 0, 0, 0);
    filtrados = filtrados.filter(
      i => new Date(i.fecha).setHours(0, 0, 0, 0) >= inicio
    );
  }

  if (config.filtros.filtroFechaFin) {
    const fin = new Date(config.filtros.filtroFechaFin).setHours(23, 59, 59, 999);
    filtrados = filtrados.filter(
      i => new Date(i.fecha).setHours(0, 0, 0, 0) <= fin
    );
  }

  if (config.filtros.filtroMontoMin !== null) {
    filtrados = filtrados.filter(i => (i.monto || 0) >= config.filtros.filtroMontoMin!);
  }
  if (config.filtros.filtroMontoMax !== null) {
    filtrados = filtrados.filter(i => (i.monto || 0) <= config.filtros.filtroMontoMax!);
  }

  if (config.filtros.filtroEstado !== FILTRO_ESTADO_MOVIMIENTO_TODOS) {
    const estadoFiltro = config.filtros.filtroEstado;
    filtrados = filtrados.filter(
      i => config.resolverEstado(i) === estadoFiltro
    );
  }

  filtrados.sort(compararMovimientosPorFechaDesc);

  return filtrados.map(config.enriquecer);
}

function fechaMovimientoMs(fecha: string): number {
  const t = new Date(fecha).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Más recientes primero; empate por id descendente. */
export function compararMovimientosPorFechaDesc(
  a: { fecha: string; id?: number },
  b: { fecha: string; id?: number }
): number {
  const diff = fechaMovimientoMs(b.fecha) - fechaMovimientoMs(a.fecha);
  if (diff !== 0) return diff;
  return (Number(b.id) || 0) - (Number(a.id) || 0);
}
