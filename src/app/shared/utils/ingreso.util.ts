import { Ingreso, IngresoEstado } from '../../core/models/ingreso.model';

export function estadoIngreso(i: Ingreso): IngresoEstado {
  return i.estado ?? 'aprobado';
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
