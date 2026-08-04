import { Gasto, Ingreso } from '../../core/models';
import { formatearISOaDDMMYYYY } from './date.util';
import {
  calcularMontoAportacionIglesia,
  CUENTA_INGRESO_TALENTO_CODIGO,
  etiquetaPorcentajeAportacion,
  MINISTERIO_IGLESIA_NOMBRE
} from '../constants/aportacion-iglesia.constants';

const SEPARADOR_DETALLE = ' \u2014 ';
const APORTACION = 'Aportaci\u00f3n';
const CATEGORIA_APORTACION = `${APORTACION} de ministerio`;

const MSG_BLOQUEO_APORTACION =
  'Este movimiento se gener\u00f3 autom\u00e1ticamente por la aportaci\u00f3n del 33% a la iglesia y no se puede modificar';

export function assertMovimientoAportacionModificable(
  movimiento: Pick<Ingreso, 'esAportacionIglesia'> | Pick<Gasto, 'esAportacionIglesia'> | null | undefined
): void {
  if (movimiento?.esAportacionIglesia) {
    throw new Error(MSG_BLOQUEO_APORTACION);
  }
}

export function ingresoEsTalento(
  ingreso: Pick<Ingreso, 'cuentaCodigo' | 'cuentaNombre' | 'categoria'> & { tipo?: string } | null | undefined
): boolean {
  if (!ingreso) return false;
  // Solo cuenta 4105 (Talento y eventos) activa la aportación del 33 %.
  return ingreso.cuentaCodigo === CUENTA_INGRESO_TALENTO_CODIGO;
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

function camposAportacionCoherentesConBruto(ingreso: Ingreso, bruto: number): boolean {
  if (ingreso.montoNetoMinisterio == null || ingreso.montoAportacionIglesia == null) {
    return false;
  }
  const suma = Math.round((ingreso.montoNetoMinisterio + ingreso.montoAportacionIglesia) * 100) / 100;
  return Math.abs(suma - bruto) < 0.02;
}

/** Monto del 33% que aporta un ingreso de talento aprobado de ministerio. */
export function calcularMontoAportacionIngreso(ingreso: Ingreso): number {
  if (!ingresoEsTalento(ingreso) || ingreso.ministerioId == null || ingreso.esAportacionIglesia) {
    return 0;
  }
  if (!ingresoEstaAprobadoParaAportacion(ingreso)) return 0;
  const bruto = Number(ingreso.monto);
  if (
    ingreso.montoAportacionIglesia != null &&
    Number.isFinite(bruto) &&
    camposAportacionCoherentesConBruto(ingreso, bruto)
  ) {
    return ingreso.montoAportacionIglesia;
  }
  return calcularMontoAportacionIglesia(bruto);
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
  if (ingreso.montoNetoMinisterio != null && camposAportacionCoherentesConBruto(ingreso, bruto)) {
    return ingreso.montoNetoMinisterio;
  }
  if (ingreso.montoAportacionIglesia != null && camposAportacionCoherentesConBruto(ingreso, bruto)) {
    return Math.round((bruto - ingreso.montoAportacionIglesia) * 100) / 100;
  }
  return Math.round((bruto - calcularMontoAportacionIglesia(bruto)) * 100) / 100;
}

/** Recalcula monto neto y aportaci?n cuando el bruto cambi? tras editar un ingreso aprobado. */
export function recalcularCamposAportacionEnIngreso(ingreso: Ingreso): Ingreso {
  if (!ingreso.aportacionGenerada || ingreso.esAportacionIglesia) return ingreso;
  if (!ingresoEsTalento(ingreso) || !ingresoEstaAprobadoParaAportacion(ingreso)) return ingreso;

  const bruto = Number(ingreso.monto);
  if (!Number.isFinite(bruto) || bruto <= 0) return ingreso;

  const montoAportacionIglesia = calcularMontoAportacionIglesia(bruto);
  return {
    ...ingreso,
    montoAportacionIglesia,
    montoNetoMinisterio: Math.round((bruto - montoAportacionIglesia) * 100) / 100
  };
}

export function referenciaIngresoOrigen(
  ingreso: Pick<Ingreso, 'descripcion' | 'id'> | null | undefined
): string {
  const detalle = String(ingreso?.descripcion ?? '').trim();
  return detalle || 'Sin descripci\u00f3n';
}

function descripcionIngresoIglesiaPorAportacion(
  ministerioNombre: string,
  pct: string,
  ref: string
): string {
  return `${APORTACION} de ${ministerioNombre} (${pct})${SEPARADOR_DETALLE}${ref}`;
}

export function crearIngresoIglesiaPorAportacion(
  ingreso: Ingreso,
  id: number | string,
  fechaFormateada: string,
  ministerioIdGeneral?: number | null
): Ingreso {
  const montoAportacion = calcularMontoAportacionIglesia(Number(ingreso.monto));
  const pct = etiquetaPorcentajeAportacion();
  const ministerioNombre = ingreso.ministerio || 'ministerio';
  const ref = referenciaIngresoOrigen(ingreso);
  const idGeneral =
    ministerioIdGeneral != null && Number.isFinite(Number(ministerioIdGeneral))
      ? Number(ministerioIdGeneral)
      : undefined;

  return {
    id: id as number,
    fecha: ingreso.fecha,
    fechaFormateada,
    descripcion: descripcionIngresoIglesiaPorAportacion(ministerioNombre, pct, ref),
    monto: montoAportacion,
    // Misma evidencia del ingreso origen (talento) para auditoría en General.
    foto: ingreso.foto?.trim() ? ingreso.foto : '',
    ...(ingreso.comprobanteTipo ? { comprobanteTipo: ingreso.comprobanteTipo } : {}),
    categoria: CATEGORIA_APORTACION,
    cuentaCodigo: '4101',
    cuentaNombre: 'Ingresos generales',
    ministerio: MINISTERIO_IGLESIA_NOMBRE,
    ...(idGeneral != null ? { ministerioId: idGeneral } : {}),
    estado: 'aprobado',
    esAportacionIglesia: true,
    ingresoOrigenId: ingreso.id,
    registradoPor: 'Sistema IECA'
  };
}

/**
 * Monto a mostrar en listados: talento aprobado → fondo del ministerio (67 %);
 * aportación iglesia → 33 %; resto → monto registrado.
 */
export function montoIngresoParaListado(ingreso: Ingreso): number {
  if (ingreso.esAportacionIglesia) return Number(ingreso.monto) || 0;
  if (ingresoEsTalento(ingreso) && ingresoEstaAprobadoParaAportacion(ingreso)) {
    return calcularMontoNetoMinisterio(ingreso);
  }
  return Number(ingreso.monto) || 0;
}

export function marcarIngresoConAportacion(
  ingreso: Ingreso,
  ingresoIglesiaId: number | string
): Ingreso {
  const montoAportacionIglesia = calcularMontoAportacionIglesia(Number(ingreso.monto));
  return {
    ...ingreso,
    aportacionGenerada: true,
    ingresoIglesiaId,
    montoAportacionIglesia,
    montoNetoMinisterio: Math.round((Number(ingreso.monto) - montoAportacionIglesia) * 100) / 100
  };
}

/** Id temporal negativo para la fila de aportaci?n mientras llega la respuesta del API. */
export function idAportacionOptimista(origenId: number): number {
  return -Math.abs(Number(origenId));
}

export function esIdAportacionOptimista(id: number | null | undefined): boolean {
  const n = Number(id);
  return Number.isFinite(n) && n < 0;
}

function quitarAportacionesOptimistasDeOrigen(lista: Ingreso[], origenId: number): Ingreso[] {
  const numOrigen = Number(origenId);
  return lista.filter(
    i =>
      !(
        esIdAportacionOptimista(i.id) &&
        i.esAportacionIglesia &&
        Number(i.ingresoOrigenId) === numOrigen
      )
  );
}

/**
 * Muestra al instante el ingreso del 33 % al aprobar talento (antes de la respuesta del API).
 */
export function aplicarAportacionOptimistaEnLista(lista: Ingreso[], origen: Ingreso): Ingreso[] {
  const origenId = Number(origen.id);
  if (!Number.isFinite(origenId) || origenId <= 0) return lista;
  if (origen.esAportacionIglesia || origen.ministerioId == null) return lista;
  if (!ingresoEsTalento(origen) || !ingresoEstaAprobadoParaAportacion(origen)) return lista;
  if (calcularMontoAportacionIglesia(Number(origen.monto)) <= 0) return lista;

  const tempId = idAportacionOptimista(origenId);
  const marcado = marcarIngresoConAportacion(origen, tempId);
  const fechaFormateada = origen.fechaFormateada || formatearISOaDDMMYYYY(origen.fecha);
  const hijo = crearIngresoIglesiaPorAportacion(marcado, tempId, fechaFormateada);

  let result = quitarAportacionesOptimistasDeOrigen(lista, origenId);
  result = result.map(i => (Number(i.id) === origenId ? marcado : i));
  return [hijo, ...result];
}

/**
 * Inserta o actualiza en la lista el ingreso autom?tico de aportaci?n (33 %)
 * cuando el origen ya trae ingresoIglesiaId desde el API.
 */
export function asegurarAportacionIglesiaEnLista(lista: Ingreso[], origen: Ingreso): Ingreso[] {
  if (
    origen.esAportacionIglesia ||
    !origen.aportacionGenerada ||
    origen.ingresoIglesiaId == null ||
    !ingresoEstaAprobadoParaAportacion(origen)
  ) {
    return lista;
  }

  const iglesiaIdRaw = origen.ingresoIglesiaId as number | string;
  const iglesiaIdNum = Number(iglesiaIdRaw);
  const iglesiaId = Number.isFinite(iglesiaIdNum) ? iglesiaIdNum : iglesiaIdRaw;
  if (iglesiaId == null || iglesiaId === '') return lista;

  let base = quitarAportacionesOptimistasDeOrigen(lista, Number(origen.id));

  const fechaFormateada = origen.fechaFormateada || formatearISOaDDMMYYYY(origen.fecha);
  const hijo = crearIngresoIglesiaPorAportacion(origen, iglesiaId, fechaFormateada);
  const idx = base.findIndex(i => String(i.id) === String(iglesiaId));
  if (idx >= 0) {
    return base.map(i => (String(i.id) === String(iglesiaId) ? hijo : i));
  }
  return [hijo, ...base];
}

/** Quita el ingreso origen y cualquier aportaci?n autom?tica (33 %) vinculada. */
export function filtrarIngresosTrasEliminarOrigen(lista: Ingreso[], origenId: number): Ingreso[] {
  const numId = Number(origenId);
  const origen = lista.find(i => Number(i.id) === numId);
  const iglesiaId =
    origen?.ingresoIglesiaId != null ? Number(origen.ingresoIglesiaId) : null;

  return lista.filter(i => {
    const id = Number(i.id);
    if (id === numId) return false;
    if (iglesiaId != null && Number.isFinite(iglesiaId) && id === iglesiaId) return false;
    if (i.esAportacionIglesia && Number(i.ingresoOrigenId) === numId) return false;
    return true;
  });
}
