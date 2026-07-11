/** Formatea una fecha ISO (o parseable) a DD/MM/YYYY */
export function formatearISOaDDMMYYYY(iso: string): string {
  if (!iso) return '';
  const s = String(iso).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const date = new Date(s);
  if (isNaN(date.getTime())) return '';
  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
