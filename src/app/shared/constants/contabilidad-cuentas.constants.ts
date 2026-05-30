/** Plan de cuentas IECA — opciones que el usuario elige al registrar ingreso o gasto. */

export interface CuentaContable {
  codigo: string;
  nombre: string;
}

/** Caja: solo se usa automáticamente en el CSV (partida doble), no en el formulario. */
export const CUENTA_CAJA: CuentaContable = {
  codigo: '1101',
  nombre: 'Caja y bancos'
};

/** Cuentas que puede elegir al registrar un ingreso. */
export const CUENTAS_INGRESO_OPCIONES: CuentaContable[] = [
  { codigo: '4101', nombre: 'Ingresos generales' },
  { codigo: '4102', nombre: 'Diezmos y ofrendas' },
  { codigo: '4103', nombre: 'Donaciones' },
  { codigo: '4104', nombre: 'Ofrendas especiales' },
  { codigo: '4105', nombre: 'Talento y eventos' },
  { codigo: '4106', nombre: 'Otros ingresos' }
];

/** Cuentas que puede elegir al registrar un gasto. */
export const CUENTAS_GASTO_OPCIONES: CuentaContable[] = [
  { codigo: '5101', nombre: 'Gastos operativos' },
  { codigo: '5102', nombre: 'Gastos por ministerio' },
  { codigo: '5103', nombre: 'Servicios y suministros' },
  { codigo: '5104', nombre: 'Mantenimiento' },
  { codigo: '5105', nombre: 'Personal y honorarios' },
  { codigo: '5106', nombre: 'Impuestos y tasas' },
  { codigo: '5107', nombre: 'Otros gastos' }
];

export function etiquetaOpcionCuenta(cuenta: CuentaContable): string {
  return `${cuenta.codigo} — ${cuenta.nombre}`;
}

export function buscarCuentaIngreso(codigo: string): CuentaContable | undefined {
  return CUENTAS_INGRESO_OPCIONES.find(c => c.codigo === codigo);
}

export function buscarCuentaGasto(codigo: string): CuentaContable | undefined {
  return CUENTAS_GASTO_OPCIONES.find(c => c.codigo === codigo);
}

export function cuentaIngresoPorDefecto(): CuentaContable {
  return CUENTAS_INGRESO_OPCIONES[1];
}

export function cuentaGastoPorDefecto(): CuentaContable {
  return CUENTAS_GASTO_OPCIONES[2];
}

/** Registros antiguos sin cuentaCodigo: intenta emparejar por texto de tipo/categoría. */
export function resolverCuentaIngresoLegacy(tipo?: string): CuentaContable {
  const key = (tipo || '').toLowerCase();
  const found = CUENTAS_INGRESO_OPCIONES.find(
    c => key.includes(c.nombre.toLowerCase()) || key.includes(c.codigo)
  );
  return found ?? CUENTAS_INGRESO_OPCIONES[0];
}

export function resolverCuentaGastoLegacy(categoria?: string): CuentaContable {
  const key = (categoria || '').toLowerCase();
  const found = CUENTAS_GASTO_OPCIONES.find(
    c => key.includes(c.nombre.toLowerCase()) || key.includes(c.codigo)
  );
  return found ?? CUENTAS_GASTO_OPCIONES[0];
}

export function resolverCuentaDesdeMovimiento(opts: {
  cuentaCodigo?: string;
  cuentaNombre?: string;
  textoLegacy?: string;
  esGasto: boolean;
}): CuentaContable {
  if (opts.cuentaCodigo) {
    const buscar = opts.esGasto ? buscarCuentaGasto : buscarCuentaIngreso;
    const c = buscar(opts.cuentaCodigo);
    if (c) return c;
    if (opts.cuentaNombre) {
      return { codigo: opts.cuentaCodigo, nombre: opts.cuentaNombre };
    }
  }
  return opts.esGasto
    ? resolverCuentaGastoLegacy(opts.textoLegacy)
    : resolverCuentaIngresoLegacy(opts.textoLegacy);
}
