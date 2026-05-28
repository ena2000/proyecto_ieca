import { Gasto, GastoEstado } from '../../core/models/gasto.model';

export function estadoGasto(g: Gasto): GastoEstado {
  return g.estado ?? 'aprobado';
}

export function gastoAprobado(g: Gasto): boolean {
  return estadoGasto(g) === 'aprobado';
}

export function gastoPendiente(g: Gasto): boolean {
  return estadoGasto(g) === 'pendiente';
}

export function etiquetaEstadoGasto(estado: GastoEstado): string {
  switch (estado) {
    case 'pendiente': return 'Pendiente';
    case 'aprobado':  return 'Aprobado';
    case 'rechazado': return 'Rechazado';
    default:          return estado;
  }
}

export function claseBadgeEstado(estado: GastoEstado): string {
  switch (estado) {
    case 'pendiente': return 'badge-pendiente';
    case 'aprobado':  return 'badge-aprobado';
    case 'rechazado': return 'badge-rechazado';
    default:          return '';
  }
}
