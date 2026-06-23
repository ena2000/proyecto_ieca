import { Gasto, GastoEstado } from '../../core/models/gasto.model';

export function estadoGasto(g: Gasto): GastoEstado {
  const raw = String(g.estado ?? 'aprobado').trim().toLowerCase();
  if (raw === 'pendiente' || raw === 'rechazado') return raw;
  return 'aprobado';
}

export function gastoAprobado(g: Gasto): boolean {
  return estadoGasto(g) === 'aprobado';
}

export function gastoPendiente(g: Gasto): boolean {
  return estadoGasto(g) === 'pendiente';
}

/** Asegura tipos y campos mínimos al hidratar o tras crear/actualizar vía API. */
export function normalizarGasto(gasto: Gasto): Gasto {
  return {
    ...gasto,
    id: gasto.id != null ? Number(gasto.id) : gasto.id,
    ministerioId: gasto.ministerioId != null ? Number(gasto.ministerioId) : undefined,
    usuarioId: gasto.usuarioId != null ? Number(gasto.usuarioId) : undefined,
    monto: gasto.monto != null ? Number(gasto.monto) : gasto.monto
  };
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
