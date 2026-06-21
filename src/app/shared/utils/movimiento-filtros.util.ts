export interface FiltrosMovimiento {
  searchTerm: string;
  filtroFechaInicio: string;
  filtroFechaFin: string;
  fechaManualDesde: string;
  fechaManualHasta: string;
  filtroMontoMin: number | null;
  filtroMontoMax: number | null;
  filtroSoloPendientes: boolean;
}

export function hayFiltrosMovimientoActivos(f: FiltrosMovimiento): boolean {
  return !!(
    f.searchTerm ||
    f.filtroFechaInicio ||
    f.filtroFechaFin ||
    f.fechaManualDesde ||
    f.fechaManualHasta ||
    f.filtroMontoMin !== null ||
    f.filtroMontoMax !== null ||
    f.filtroSoloPendientes
  );
}

export interface FiltrarMovimientosConfig<T> {
  items: T[];
  ministerioScopeId: number | null;
  filtros: FiltrosMovimiento;
  textoBusqueda: (item: T) => string[];
  esPendiente: (item: T) => boolean;
  enriquecer: (item: T) => T;
}

export function filtrarMovimientos<T extends { fecha: string; monto?: number | null; ministerioId?: number }>(
  config: FiltrarMovimientosConfig<T>
): T[] {
  let filtrados = [...config.items];

  if (config.ministerioScopeId != null) {
    filtrados = filtrados.filter(
      i => Number(i.ministerioId) === config.ministerioScopeId
    );
  }

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

  if (config.filtros.filtroSoloPendientes) {
    filtrados = filtrados.filter(config.esPendiente);
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
