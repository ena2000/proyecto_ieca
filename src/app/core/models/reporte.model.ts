export interface DesgloseReporte {
  categoria: string;
  ingresos: number;
  gastos: number;
  saldo: number;
}

export interface DesgloseMinisterioReporte {
  ministerioId: number;
  nombre: string;
  ingresos: number;
  gastos: number;
  saldo: number;
  saldoDisponible: number;
}

export interface Reporte {
  id: number;
  fecha: string;
  titulo: string;
  tipo: string;
  cuentaCodigo?: string;
  cuentaNombre?: string;
  ingresos: number;
  gastos: number;
  saldo: number;
  archivo: string;
  ministerio?: string;
  ministerioId?: number;
  mes?: string;
  desglose?: DesgloseReporte[];
  fechaFormateada?: string;
}
