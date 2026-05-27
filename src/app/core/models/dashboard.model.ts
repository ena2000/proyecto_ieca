export interface Movimiento {
  tipo: 'ingreso' | 'gasto';
  titulo: string;
  ministerio: string;
  monto: number;
  fecha: string;
}

export interface KPIs {
  balance: number;
  ingresos: number;
  gastosMes: number;
  ministeriosActivos: number;
  tendenciaIngresos: string;
  tendenciaGastos: string;
  superavit: number;
  transacciones: number;
}

export interface MesData {
  mes: string;
  ingresos: number;
  gastos: number;
}
