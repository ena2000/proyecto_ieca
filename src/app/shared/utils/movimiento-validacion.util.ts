import {
  esFechaMovimientoFutura,
  esFechaCalendarioValidaDDMMYYYY,
  MENSAJE_FECHA_MOVIMIENTO_FUTURA,
  MENSAJE_FECHA_CALENDARIO_INVALIDA
} from './movimiento-fecha.util';

export const MOVIMIENTO_DESCRIPCION_MIN = 3;
export const MOVIMIENTO_DESCRIPCION_MAX = 500;
export const MOVIMIENTO_MONTO_MAX = 999_999_999;

export interface ValidacionFormularioMovimiento {
  descripcion?: string;
  monto: number | null;
  fechaManualForm: string;
  fechaIso?: string;
  cuentaCodigo?: string;
  ministerioId?: number;
  listaMinisteriosLength: number;
  ministerioScopeId: number | null;
}

export function mensajeErrorDescripcionMovimiento(descripcion?: string): string | null {
  const t = String(descripcion ?? '').trim();
  if (t.length < MOVIMIENTO_DESCRIPCION_MIN) {
    return `La descripción debe tener al menos ${MOVIMIENTO_DESCRIPCION_MIN} caracteres.`;
  }
  if (t.length > MOVIMIENTO_DESCRIPCION_MAX) {
    return `La descripción no puede superar ${MOVIMIENTO_DESCRIPCION_MAX} caracteres.`;
  }
  if (/[<>]/.test(t)) {
    return 'Quita caracteres no permitidos (< >) de la descripción.';
  }
  return null;
}

export function mensajeErrorMontoMovimiento(monto: number | null | undefined): string | null {
  const n = Number(monto);
  if (!Number.isFinite(n) || n <= 0) {
    return 'Ingresa un monto válido mayor a cero.';
  }
  if (n > MOVIMIENTO_MONTO_MAX) {
    return `El monto no puede superar ${MOVIMIENTO_MONTO_MAX.toLocaleString('es-EC')}.`;
  }
  return null;
}

export function mensajeErrorFechaMovimiento(
  fechaManualForm: string,
  fechaIso?: string
): string | null {
  if (!fechaManualForm || fechaManualForm.length !== 10) {
    return 'Ingresa una fecha válida (DD/MM/AAAA).';
  }
  if (!esFechaCalendarioValidaDDMMYYYY(fechaManualForm)) {
    return MENSAJE_FECHA_CALENDARIO_INVALIDA;
  }
  if (esFechaMovimientoFutura(fechaManualForm, fechaIso)) {
    return MENSAJE_FECHA_MOVIMIENTO_FUTURA;
  }
  return null;
}

export function esFormularioMovimientoValido(v: ValidacionFormularioMovimiento): boolean {
  const ministerioRequerido =
    v.listaMinisteriosLength > 0 && v.ministerioScopeId == null;
  const ministerioOk =
    v.ministerioScopeId != null ||
    v.listaMinisteriosLength === 0 ||
    v.ministerioId != null;

  return (
    !mensajeErrorDescripcionMovimiento(v.descripcion) &&
    !mensajeErrorMontoMovimiento(v.monto) &&
    !!v.cuentaCodigo?.trim() &&
    !mensajeErrorFechaMovimiento(v.fechaManualForm, v.fechaIso) &&
    (!ministerioRequerido || v.ministerioId != null) &&
    ministerioOk
  );
}

export function mensajeValidacionMovimiento(v: ValidacionFormularioMovimiento): string {
  return (
    mensajeErrorMontoMovimiento(v.monto) ||
    (v.listaMinisteriosLength > 0 && v.ministerioScopeId == null && v.ministerioId == null
      ? 'Selecciona un ministerio.'
      : null) ||
    (!v.cuentaCodigo?.trim() ? 'Selecciona una cuenta contable.' : null) ||
    mensajeErrorDescripcionMovimiento(v.descripcion) ||
    mensajeErrorFechaMovimiento(v.fechaManualForm, v.fechaIso) ||
    'Por favor, completa los campos obligatorios correctamente.'
  );
}
