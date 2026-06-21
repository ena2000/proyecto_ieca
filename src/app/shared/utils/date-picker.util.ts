/** Convierte ISO a valor para input type="date" (YYYY-MM-DD). */
export function isoToDateInputValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Vacía inputs type="date" (p. ej. tras «Limpiar filtros» o borrar en el selector). */
export function resetNativosDateInputs(
  inputs: Array<HTMLInputElement | null | undefined>
): void {
  for (const input of inputs) {
    if (input) input.value = '';
  }
}

/** Abre el selector nativo del navegador en el primer clic. */
export function abrirSelectorFechaNativo(input: HTMLInputElement | null | undefined): void {
  if (!input) return;
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // fallback
    }
  }
  input.click();
}
