import { Reporte } from '../../core/models';
import { etiquetaParaMes, nombreMesDesdeValor, padMes } from './month.util';

export type FiltroMovimientoReporte = 'todos' | 'ingresos' | 'gastos';
export type PeriodoPresetReporte = 'todos' | 'este_mes' | 'anterior' | 'custom';

export interface FiltrosReporte {
  searchTerm: string;
  filtroMes: string;
  filtroMinisterioId: number | null;
  filtroMovimiento: FiltroMovimientoReporte;
  periodoPreset: PeriodoPresetReporte;
  ministerioScopeId: number | null;
}

export function esRegistroIngresoReporte(r: Reporte): boolean {
  return (r.ingresos || 0) > 0 && (r.gastos || 0) === 0;
}

export function esRegistroGastoReporte(r: Reporte): boolean {
  return (r.gastos || 0) > 0 && (r.ingresos || 0) === 0;
}

export function resolverFiltroMesPorPreset(
  preset: PeriodoPresetReporte,
  hoy: Date = new Date()
): string {
  if (preset === 'todos') return '';
  if (preset === 'este_mes') return padMes(hoy);
  if (preset === 'anterior') {
    return padMes(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
  }
  return '';
}

export function hayFiltrosReporteActivos(f: FiltrosReporte): boolean {
  if (f.searchTerm.trim()) return true;
  if (f.periodoPreset !== 'este_mes') return true;
  if (f.filtroMovimiento !== 'todos') return true;
  if (f.ministerioScopeId == null && f.filtroMinisterioId !== null) return true;
  return false;
}

export function filtrarReportes(
  lista: Reporte[],
  f: FiltrosReporte
): Reporte[] {
  let filtrados = [...lista];

  if (f.ministerioScopeId != null) {
    filtrados = filtrados.filter(r => Number(r.ministerioId) === f.ministerioScopeId);
  }

  if (f.searchTerm) {
    const search = f.searchTerm.toLowerCase();
    filtrados = filtrados.filter(r =>
      r.titulo?.toLowerCase().includes(search) ||
      r.tipo?.toLowerCase().includes(search) ||
      r.cuentaCodigo?.toLowerCase().includes(search) ||
      r.cuentaNombre?.toLowerCase().includes(search) ||
      r.ministerio?.toLowerCase().includes(search)
    );
  }

  if (f.filtroMes) {
    filtrados = filtrados.filter(r => r.mes === f.filtroMes);
  }

  if (f.filtroMinisterioId !== null) {
    const filtroId = Number(f.filtroMinisterioId);
    filtrados = filtrados.filter(r => Number(r.ministerioId) === filtroId);
  }

  if (f.filtroMovimiento === 'ingresos') {
    filtrados = filtrados.filter(esRegistroIngresoReporte);
  } else if (f.filtroMovimiento === 'gastos') {
    filtrados = filtrados.filter(esRegistroGastoReporte);
  }

  return filtrados;
}

export function mesesDisponiblesDesdeReportes(
  lista: Reporte[],
  mesSeleccionado?: string | null
): { value: string; label: string }[] {
  const meses = new Set<string>();
  lista.forEach(r => {
    if (r.mes) meses.add(r.mes);
  });
  meses.add(padMes(new Date()));
  // Incluye el mes del filtro aunque no haya movimientos (evita select vacío).
  if (mesSeleccionado?.trim()) {
    meses.add(mesSeleccionado.trim());
  }
  return Array.from(meses)
    .sort((a, b) => b.localeCompare(a))
    .map(value => ({ value, label: etiquetaParaMes(value) }));
}

/** Años del historial (continuo desde el más antiguo con datos hasta hoy). */
export function aniosDisponiblesDesdeReportes(
  lista: Reporte[],
  mesSeleccionado?: string | null,
  hoy: Date = new Date()
): number[] {
  const anios = new Set<number>();
  anios.add(hoy.getFullYear());
  lista.forEach(r => {
    const y = Number(r.mes?.slice(0, 4));
    if (Number.isFinite(y) && y > 1990 && y < 2100) anios.add(y);
  });
  const sel = Number(mesSeleccionado?.slice(0, 4));
  if (Number.isFinite(sel) && sel > 1990 && sel < 2100) anios.add(sel);

  const valores = Array.from(anios);
  const minFromData = Math.min(...valores);
  // Al menos 10 años hacia atrás para saltar sin 100 clics de flecha.
  const min = Math.min(minFromData, hoy.getFullYear() - 10);
  const max = Math.max(...valores, hoy.getFullYear());
  const out: number[] = [];
  for (let y = max; y >= min; y--) out.push(y);
  return out;
}

/** Meses de un año (1–12), sin futuros si es el año actual. */
export function mesesDelAnioParaReporte(
  anio: number,
  hoy: Date = new Date()
): { value: string; label: string }[] {
  if (!Number.isFinite(anio) || anio > hoy.getFullYear()) return [];
  const maxMes = anio === hoy.getFullYear() ? hoy.getMonth() + 1 : 12;
  const out: { value: string; label: string }[] = [];
  for (let m = 1; m <= maxMes; m++) {
    const value = `${anio}-${String(m).padStart(2, '0')}`;
    out.push({ value, label: nombreMesDesdeValor(value) });
  }
  return out;
}

export function anioDesdeFiltroMes(filtroMes: string, hoy: Date = new Date()): number {
  const y = Number(filtroMes?.slice(0, 4));
  return Number.isFinite(y) && y > 1990 ? y : hoy.getFullYear();
}

/** Compone YYYY-MM; si el mes no existe en ese año (futuro), usa el último válido. */
export function componerFiltroMesAnio(
  anio: number,
  mes1a12: number,
  hoy: Date = new Date()
): string {
  const meses = mesesDelAnioParaReporte(anio, hoy);
  if (!meses.length) return padMes(hoy);
  const padded = `${anio}-${String(mes1a12).padStart(2, '0')}`;
  if (meses.some(m => m.value === padded)) return padded;
  return meses[meses.length - 1].value;
}

export function puedeAvanzarMesReporte(filtroMes: string): boolean {
  if (!filtroMes) return false;
  return filtroMes < padMes(new Date());
}

export function mesAnteriorReporte(filtroMes: string): string {
  const base = filtroMes || padMes(new Date());
  const [anio, mes] = base.split('-').map(Number);
  return padMes(new Date(anio, mes - 2, 1));
}

export function mesSiguienteReporte(filtroMes: string): string {
  const [anio, mes] = filtroMes.split('-').map(Number);
  return padMes(new Date(anio, mes, 1));
}

export function etiquetaFiltroMovimientoReporte(
  filtro: FiltroMovimientoReporte
): string {
  if (filtro === 'ingresos') return 'Solo ingresos';
  if (filtro === 'gastos') return 'Solo gastos';
  return 'Ingresos y gastos';
}

export function construirEtiquetaFiltroReporte(opts: {
  filtroMes: string;
  etiquetaMesActivo: string;
  filtroMinisterioId: number | null;
  ministerioScopeId: number | null;
  nombreMinisterio?: string;
  searchTerm: string;
  filtroMovimiento: FiltroMovimientoReporte;
}): string {
  const partes: string[] = [];
  partes.push(
    opts.filtroMes ? `Período: ${opts.etiquetaMesActivo}` : 'Período: todo el historial'
  );

  if (opts.filtroMinisterioId !== null) {
    partes.push(`Ministerio: ${opts.nombreMinisterio || opts.filtroMinisterioId}`);
  } else if (opts.ministerioScopeId == null) {
    partes.push('Ministerio: todos');
  }

  if (opts.searchTerm.trim()) {
    partes.push(`Búsqueda: "${opts.searchTerm.trim()}"`);
  }

  if (opts.filtroMovimiento !== 'todos') {
    partes.push(`Movimiento: ${etiquetaFiltroMovimientoReporte(opts.filtroMovimiento)}`);
  }

  return partes.join(' · ');
}
