import { AuditoriaMovimiento } from './auditoria.model';

export type IngresoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Ingreso extends AuditoriaMovimiento {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  tipo: string;
  /** Cuenta contable elegida en el formulario. */
  cuentaCodigo?: string;
  cuentaNombre?: string;
  ministerio: string;
  ministerioId?: number;
  usuarioId?: number;
  registradoPor?: string;
  fechaFormateada?: string;
  estado?: IngresoEstado;
  motivoRechazo?: string;
  comprobanteTipo?: 'imagen' | 'pdf';
  /** Periodo contable cerrado (cierre mensual). */
  cerrado?: boolean;
  periodoCierre?: string;
}
