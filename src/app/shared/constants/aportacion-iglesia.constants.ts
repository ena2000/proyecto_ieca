/** Porcentaje de cada ingreso de ministerio que se transfiere al fondo de la iglesia. */
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
