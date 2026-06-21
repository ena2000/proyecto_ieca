import { Ingreso, IngresoEstado } from '../../core/models/ingreso.model';

type IngresoLegacy = Ingreso & { tipo?: string };

/** Lee categoría contable; acepta registros legacy con campo `tipo`. */
export function categoriaIngreso(ingreso: Pick<Ingreso, 'categoria'> & { tipo?: string }): string {
  return ingreso.categoria || ingreso.tipo || '';
}

/** Unifica `tipo` legacy → `categoria` al cargar desde API o localStorage. */
export function normalizarIngreso(ingreso: IngresoLegacy): Ingreso {
  const categoria = categoriaIngreso(ingreso);
  const { tipo: _tipo, ...rest } = ingreso;
  return { ...rest, categoria };
}

export function estadoIngreso(i: Ingreso): IngresoEstado {
  const raw = String(i.estado ?? 'aprobado').trim().toLowerCase();
  if (raw === 'pendiente' || raw === 'rechazado') return raw;
  return 'aprobado';
}

export function ingresoAprobado(i: Ingreso): boolean {
  return estadoIngreso(i) === 'aprobado';
}

export function ingresoPendiente(i: Ingreso): boolean {
  return estadoIngreso(i) === 'pendiente';
}

export function etiquetaEstadoIngreso(estado: IngresoEstado): string {
  switch (estado) {
    case 'pendiente': return 'Pendiente';
    case 'aprobado':  return 'Aprobado';
    case 'rechazado': return 'Rechazado';
    default:          return estado;
  }
}
