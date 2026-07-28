/** Formatea una fecha ISO (o parseable) a DD/MM/YYYY en calendario local. */
export function formatearISOaDDMMYYYY(iso: string): string {
  if (!iso) return '';
  const s = String(iso).trim();
  // Solo día calendario (sin hora ni zona): no reinterpretar como UTC.
  const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (soloDia) {
    return `${soloDia[3]}/${soloDia[2]}/${soloDia[1]}`;
  }
  const date = new Date(s);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
