/** Normaliza ids de ion-select (a menudo string) a number | null. */
export function aIdNumericoONull(valor: unknown): number | null {
  if (valor == null || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** Compara dos ids sin importar si vienen como number o string. */
export function mismoIdNumerico(a: unknown, b: unknown): boolean {
  const na = aIdNumericoONull(a);
  const nb = aIdNumericoONull(b);
  if (na == null || nb == null) return false;
  return na === nb;
}
