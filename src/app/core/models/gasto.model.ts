import { AuditoriaMovimiento } from './auditoria.model';

export type GastoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Gasto extends AuditoriaMovimiento {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  categoria: string;
  cuentaCodigo?: string;
  cuentaNombre?: string;
  /** Legacy: registros antiguos pueden tener valor; ya no se captura en el formulario. */
  proveedor?: string;
  ministerio?: string;
  ministerioId?: number;
  usuarioId?: number;
  registradoPor?: string;
  fechaFormateada?: string;
  /** Flujo de aprobación: líder → pendiente; solo el administrador aprueba o rechaza. */
  estado?: GastoEstado;
  motivoRechazo?: string;
  comprobanteTipo?: 'imagen' | 'pdf';
  cerrado?: boolean;
  periodoCierre?: string;
}
