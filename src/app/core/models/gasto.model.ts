export type GastoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Gasto {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  categoria: string;
  proveedor: string;
  ministerio?: string;
  ministerioId?: number;
  usuarioId?: number;
  registradoPor?: string;
  fechaFormateada?: string;
  /** Flujo de aprobación: líder → pendiente; admin/contable aprueban o rechazan. */
  estado?: GastoEstado;
  motivoRechazo?: string;
  comprobanteTipo?: 'imagen' | 'pdf';
}
