import { AuditoriaMovimiento } from './auditoria.model';

export type IngresoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Ingreso extends AuditoriaMovimiento {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  /** Clasificación contable (nombre de la cuenta elegida; mismo campo que en Gasto). */
  categoria: string;
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
  /** Movimiento generado automáticamente por la aportación del 33% a la iglesia. */
  esAportacionIglesia?: boolean;
  ingresoOrigenId?: number;
  /** Ingreso de ministerio con aportación ya generada. */
  aportacionGenerada?: boolean;
  /** @deprecated Ya no se generan gastos; solo para limpiar datos antiguos. */
  gastoAportacionId?: number;
  ingresoIglesiaId?: number;
  montoAportacionIglesia?: number;
  /** Parte del ingreso que permanece en el fondo del ministerio (67%). */
  montoNetoMinisterio?: number;
}
