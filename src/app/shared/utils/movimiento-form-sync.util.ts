import { isoDesdeFechaManualDDMMYYYY } from './movimiento-fecha.util';

/** Lee el valor de ion-input / ion-textarea (CustomEvent) o input nativo. */
export function leerValorIonInput(event: Event): string {
  const ion = event as CustomEvent<{ value?: string | null }>;
  if (ion.detail?.value != null) {
    return String(ion.detail.value);
  }
  const el = event.target as HTMLInputElement | null;
  return el?.value != null ? String(el.value) : '';
}

export function normalizarMontoFormulario(monto: number | string | null | undefined): number | null {
  if (monto == null || monto === '') return null;
  const n = Number(monto);
  return Number.isFinite(n) ? n : null;
}

/** IonInput expone getInputElement(); lee el valor real del DOM antes de validar/guardar. */
export async function leerValorIonInputAsync(
  input: { getInputElement: () => Promise<HTMLInputElement | HTMLTextAreaElement> } | undefined | null
): Promise<string> {
  if (!input) return '';
  try {
    const el = await Promise.race([
      input.getInputElement(),
      new Promise<HTMLInputElement | HTMLTextAreaElement>((_, reject) => {
        setTimeout(() => reject(new Error('ion-input timeout')), 1_500);
      })
    ]);
    return el?.value != null ? String(el.value) : '';
  } catch {
    return '';
  }
}

export function aplicarValoresTextoAlMovimiento<
  T extends { monto?: number | null; descripcion?: string }
>(movimiento: T, montoRaw: string, descripcionRaw: string): T {
  let out = { ...movimiento };
  const monto = normalizarMontoFormulario(montoRaw.trim() !== '' ? montoRaw : movimiento.monto);
  if (monto != null) {
    out = { ...out, monto };
  }
  const desc = descripcionRaw.trim() || movimiento.descripcion?.trim() || '';
  if (desc) {
    out = { ...out, descripcion: desc };
  }
  return out;
}

/** Firestore ~1 MB/doc; límite conservador para subida rápida en Render. */
export const MAX_COMPROBANTE_BASE64 = 500_000;

export function validarTamanoComprobante(foto?: string | null): string | null {
  if (!foto?.trim()) return null;
  if (foto.length > MAX_COMPROBANTE_BASE64) {
    return 'El comprobante es demasiado grande. Usa una imagen más pequeña o un PDF ligero (máx. ~350 KB).';
  }
  return null;
}

export function sincronizarFechaFormularioMovimiento(
  fechaManualForm: string,
  fechaActualIso: string
): { fechaManualForm: string; fechaIso: string | null } {
  const manual = fechaManualForm.trim();
  const isoDesdeManual = isoDesdeFechaManualDDMMYYYY(manual);
  if (isoDesdeManual) {
    return { fechaManualForm: manual, fechaIso: isoDesdeManual };
  }
  if (manual.length === 10) {
    return { fechaManualForm: manual, fechaIso: null };
  }
  return { fechaManualForm: manual, fechaIso: fechaActualIso || null };
}
