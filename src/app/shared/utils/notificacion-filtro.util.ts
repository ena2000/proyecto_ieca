import { Notificacion } from '../../core/models/notificacion.model';
import { AppRole, ROLES } from '../../core/constants/roles.constants';

/** Filtra notificaciones según rol (app web). */
export function filtrarNotificacionesParaSesion(
  lista: Notificacion[],
  rol: AppRole | null | undefined,
  ministerioId?: number | null,
  usuarioId?: string | null
): Notificacion[] {
  return lista.filter(n => {
    if (usuarioId && n.actorUserId && String(n.actorUserId) === String(usuarioId)) {
      return false;
    }
    const aud = n.audiencia ?? 'staff';
    if (rol === ROLES.LIDER) {
      if (aud !== 'lider') return false;
      if (n.ministerioId == null || ministerioId == null) return false;
      return Number(n.ministerioId) === Number(ministerioId);
    }
    if (rol === ROLES.ADMIN || rol === ROLES.CONTABLE) {
      return aud === 'staff';
    }
    return false;
  });
}

export function puedeVerNotificaciones(rol: AppRole | null | undefined): boolean {
  return rol === ROLES.ADMIN || rol === ROLES.CONTABLE || rol === ROLES.LIDER;
}
