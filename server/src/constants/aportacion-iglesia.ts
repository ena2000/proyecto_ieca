/** Porcentaje de cada ingreso de ministerio que se transfiere al fondo de la iglesia. */
const APORTACION_IGLESIA_PORCENTAJE = 0.33;

const MINISTERIO_IGLESIA_NOMBRE = 'General';

/** Cuenta contable «Talento y eventos» — única que activa la aportación del 33%. */
const CUENTA_INGRESO_TALENTO_CODIGO = '4105';

function ingresoEsTalento(ingreso) {
  // Solo la cuenta 4105 activa la aportación del 33 % (evita falsos positivos por texto).
  return ingreso?.cuentaCodigo === CUENTA_INGRESO_TALENTO_CODIGO;
}

function calcularMontoAportacionIglesia(monto: number): number {
  if (!Number.isFinite(monto) || monto <= 0) return 0;
  return Math.round(monto * APORTACION_IGLESIA_PORCENTAJE * 100) / 100;
}

function etiquetaPorcentajeAportacion(): string {
  return `${Math.round(APORTACION_IGLESIA_PORCENTAJE * 100)}%`;
}

module.exports = {
  APORTACION_IGLESIA_PORCENTAJE,
  MINISTERIO_IGLESIA_NOMBRE,
  CUENTA_INGRESO_TALENTO_CODIGO,
  ingresoEsTalento,
  calcularMontoAportacionIglesia,
  etiquetaPorcentajeAportacion
};
