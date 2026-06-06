export interface KardexLinea {
  fecha: string;
  fechaFormateada: string;
  descripcion: string;
  cuentaEtiqueta: string;
  tipo: 'ingreso' | 'gasto';
  ingreso: number;
  gasto: number;
  saldo: number;
}
