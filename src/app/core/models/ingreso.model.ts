export interface Ingreso {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  tipo: string;
  ministerio: string;
  ministerioId?: number;
  usuarioId?: number;
  registradoPor?: string;
  fechaFormateada?: string;
}
