import { Gasto, Ingreso } from '../../core/models';
import {
  calcularMontoAportacionIglesia,
  CUENTA_INGRESO_TALENTO_CODIGO,
  etiquetaPorcentajeAportacion,
  MINISTERIO_IGLESIA_NOMBRE
} from '../constants/aportacion-iglesia.constants';

const MSG_BLOQUEO_APORTACION =
  'Este movimiento se generó automáticamente por la aportación del 33% a la iglesia y no se puede modificar';

export function assertMovimientoAportacionModificable(
  movimiento: Pick<Ingreso, 'esAportacionIglesia'> | Pick<Gasto, 'esAportacionIglesia'> | null | undefined
): void {
  if (movimiento?.esAportacionIglesia) {
    throw new Error(MSG_BLOQUEO_APORTACION);
  }
}

export function ingresoEsTalento(
  ingreso: Pick<Ingreso, 'cuentaCodigo' | 'cuentaNombre' | 'tipo'> | null | undefined
): boolean {
  if (!ingreso) return false;
  if (ingreso.cuentaCodigo === CUENTA_INGRESO_TALENTO_CODIGO) return true;
  const texto = `${ingreso.cuentaNombre ?? ''} ${ingreso.tipo ?? ''}`.toLowerCase();
  return texto.includes('talento');
}

export function ingresoRequiereAportacion(ingreso: Ingreso | null | undefined): boolean {
  if (!ingreso || ingreso.esAportacionIglesia) return false;
  if (ingreso.aportacionGenerada) return false;
  if (!ingresoEsTalento(ingreso)) return false;
  if (ingreso.ministerioId == null) return false;
  const monto = Number(ingreso.monto);
  if (!Number.isFinite(monto) || monto <= 0) return false;
  return calcularMontoAportacionIglesia(monto) > 0;
}

export function ingresoEstaAprobadoParaAportacion(ingreso: Ingreso): boolean {
  const estado = ingreso.estado;
  return !estado || estado === 'aprobado';
}

/** Monto del 33% que aporta un ingreso de talento aprobado de ministerio. */
export function calcularMontoAportacionIngreso(ingreso: Ingreso): number {
  if (!ingresoEsTalento(ingreso) || ingreso.ministerioId == null || ingreso.esAportacionIglesia) {
    return 0;
  }
  if (!ingresoEstaAprobadoParaAportacion(ingreso)) return 0;
  if (ingreso.montoAportacionIglesia != null) return ingreso.montoAportacionIglesia;
  return calcularMontoAportacionIglesia(Number(ingreso.monto));
}

export interface AportacionMinisterioResumen {
  ministerioId: number;
  nombre: string;
  aportacion: number;
}

/** Monto que queda en el fondo del ministerio tras descontar el 33% a la iglesia. */
export function calcularMontoNetoMinisterio(ingreso: Ingreso): number {
  const bruto = Number(ingreso.monto);
  if (!Number.isFinite(bruto) || bruto <= 0) return 0;
  if (ingreso.esAportacionIglesia || ingreso.ministerioId == null) return bruto;
  if (!ingresoEsTalento(ingreso)) return bruto;
  if (ingreso.montoNetoMinisterio != null) return ingreso.montoNetoMinisterio;
  if (ingreso.montoAportacionIglesia != null) {
    return Math.round((bruto - ingreso.montoAportacionIglesia) * 100) / 100;
  }
  return Math.round((bruto - calcularMontoAportacionIglesia(bruto)) * 100) / 100;
}

export function crearIngresoIglesiaPorAportacion(
  ingreso: Ingreso,
  id: number,
  fechaFormateada: string
): Ingreso {
  const montoAportacion = calcularMontoAportacionIglesia(Number(ingreso.monto));
  const pct = etiquetaPorcentajeAportacion();
  const ministerioNombre = ingreso.ministerio || 'ministerio';
  const ref = `ingreso #${ingreso.id}`;

  return {
    id,
    fecha: ingreso.fecha,
    fechaFormateada,
    descripcion: `Aportación de ${ministerioNombre} (${pct}) — ${ref}`,
    monto: montoAportacion,
    foto: '',
    tipo: 'Aportación de ministerio',
    cuentaCodigo: '4101',
    cuentaNombre: 'Ingresos generales',
    ministerio: MINISTERIO_IGLESIA_NOMBRE,
    estado: 'aprobado',
    esAportacionIglesia: true,
    ingresoOrigenId: ingreso.id,
    registradoPor: 'Sistema IECA'
  };
}

export function marcarIngresoConAportacion(ingreso: Ingreso, ingresoIglesiaId: number): Ingreso {
  const montoAportacionIglesia = calcularMontoAportacionIglesia(Number(ingreso.monto));
  return {
    ...ingreso,
    aportacionGenerada: true,
    ingresoIglesiaId,
    montoAportacionIglesia,
    montoNetoMinisterio: Math.round((Number(ingreso.monto) - montoAportacionIglesia) * 100) / 100
  };
}
