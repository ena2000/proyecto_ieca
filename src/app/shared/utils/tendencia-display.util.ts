export type VerboTendencia = 'Subió' | 'Bajó' | 'Igual';

/** Parsea el valor del KPI (ej. "-93%", "0%"). */
export function parseTendenciaKpi(valor: string): number {
  const n = Number.parseInt(valor.replace('%', '').trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Subió / Bajó / Igual según el signo del cálculo (sin alterar la lógica). */
export function verboTendenciaDisplay(valor: string): VerboTendencia {
  const n = parseTendenciaKpi(valor);
  if (n > 0) return 'Subió';
  if (n < 0) return 'Bajó';
  return 'Igual';
}

/** Flecha y porcentaje con signo real: "↑ +15%" o "↓ -93%". */
export function porcentajeTendenciaDisplay(valor: string): string {
  const n = parseTendenciaKpi(valor);
  if (n === 0) return '0%';
  const flecha = n > 0 ? '↑' : '↓';
  const signo = n > 0 ? '+' : '-';
  return `${flecha} ${signo}${Math.abs(n)}%`;
}

/** Texto completo en una línea (tarjetas compactas). */
export function formatTendenciaPorcentajeDisplay(valor: string): string {
  const verbo = verboTendenciaDisplay(valor);
  if (verbo === 'Igual') return 'Igual que mes ant.';
  return `${porcentajeTendenciaDisplay(valor)} · ${verbo}`;
}
