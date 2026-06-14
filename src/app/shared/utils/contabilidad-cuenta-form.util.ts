import { Ingreso, Gasto } from '../../core/models';
import {
  buscarCuentaGasto,
  buscarCuentaIngreso,
  CuentaContable
} from '../constants/contabilidad-cuentas.constants';

export function aplicarCuentaEnIngreso(ingreso: Ingreso, codigo: string): void {
  const cuenta = buscarCuentaIngreso(codigo);
  if (!cuenta) return;
  ingreso.cuentaCodigo = cuenta.codigo;
  ingreso.cuentaNombre = cuenta.nombre;
  ingreso.categoria = cuenta.nombre;
}

export function aplicarCuentaEnGasto(gasto: Gasto, codigo: string): void {
  const cuenta = buscarCuentaGasto(codigo);
  if (!cuenta) return;
  gasto.cuentaCodigo = cuenta.codigo;
  gasto.cuentaNombre = cuenta.nombre;
  gasto.categoria = cuenta.nombre;
}

export function inicializarCuentaIngreso(ingreso: Ingreso, cuenta: CuentaContable): void {
  aplicarCuentaEnIngreso(ingreso, cuenta.codigo);
}

export function inicializarCuentaGasto(gasto: Gasto, cuenta: CuentaContable): void {
  aplicarCuentaEnGasto(gasto, cuenta.codigo);
}
