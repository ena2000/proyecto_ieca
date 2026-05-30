import { esComprobantePdf } from './comprobante-upload.util';

export interface VisorComprobanteState {
  comprobanteSeleccionado: string | null;
  comprobanteEsPdf: boolean;
}

export function abrirVisorComprobante(url: string): VisorComprobanteState {
  document.body.style.overflow = 'hidden';
  return {
    comprobanteSeleccionado: url,
    comprobanteEsPdf: esComprobantePdf(url)
  };
}

export function cerrarVisorComprobante(): VisorComprobanteState {
  document.body.style.overflow = 'auto';
  return { comprobanteSeleccionado: null, comprobanteEsPdf: false };
}

export function mensajeErrorGuardadoMovimiento(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  if (error.message === 'STORAGE_QUOTA') {
    return 'No se pudo guardar. El comprobante es muy grande; intenta uno más pequeño.';
  }
  return error.message;
}
