/**
 * Constantes de aportación iglesia (frontend).
 * DEBE coincidir con `server/src/constants/aportacion-iglesia.ts`
 * (porcentaje 0.33, cuenta talento 4105, ministerio General).
 * Hay un test FE y uno BE que fijan estos valores para evitar drift.
 */
export const APORTACION_IGLESIA_PORCENTAJE = 0.33;

export const MINISTERIO_IGLESIA_NOMBRE = 'General';

/** Cuenta contable «Talento y eventos» — única que activa la aportación del 33%. */
export const CUENTA_INGRESO_TALENTO_CODIGO = '4105';

export function calcularMontoAportacionIglesia(monto: number): number {
  if (!Number.isFinite(monto) || monto <= 0) return 0;
  return Math.round(monto * APORTACION_IGLESIA_PORCENTAJE * 100) / 100;
}

export function etiquetaPorcentajeAportacion(): string {
  return `${Math.round(APORTACION_IGLESIA_PORCENTAJE * 100)}%`;
}
