export interface Ministerio {
  id: number;
  fecha?: string;
  nombre: string;
  estado: string;
  fechaFormateada?: string;
  /** Etiquetas para tabla (resueltas desde usuarios). */
  colaboradoresNombre?: string;
  /** @deprecated Datos legacy; ya no se usan en el formulario. */
  hldrId?: number;
  /** @deprecated Datos legacy; ya no se usan en el formulario. */
  coLiderId?: number;
  /** @deprecated */
  liderNombre?: string;
  /** @deprecated */
  coLiderNombre?: string;
}
