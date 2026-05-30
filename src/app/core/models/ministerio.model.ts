export interface Ministerio {
  id: number;
  fecha?: string;
  nombre: string;
  estado: string;
  hldrId?: number;
  coLiderId?: number;
  fechaFormateada?: string;
  /** Etiquetas para tabla (resueltas desde usuarios). */
  liderNombre?: string;
  coLiderNombre?: string;
}
