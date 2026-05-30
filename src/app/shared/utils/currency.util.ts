/** Formato de moneda consistente en toda la app ($ es-MX). */
export function formatearMoneda(value: number | null | undefined): string {
  const n = value ?? 0;
  return '$ ' + n.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
