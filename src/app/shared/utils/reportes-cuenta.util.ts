import { Reporte } from '../../core/models';

/** Etiqueta de cuenta para tablas y desglose en Reportes. */
export function etiquetaCuentaReporte(r: Pick<Reporte, 'cuentaCodigo' | 'cuentaNombre' | 'tipo'>): string {
  if (r.cuentaCodigo && r.cuentaNombre) {
    return `${r.cuentaCodigo} — ${r.cuentaNombre}`;
  }
  return r.cuentaNombre || r.tipo || 'Sin cuenta';
}
