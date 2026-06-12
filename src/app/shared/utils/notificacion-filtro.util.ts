import { Notificacion } from '../../core/models/notificacion.model';
import {
  AppRole,
  ROLES,
  ROL_LIDER_LEGACY,
  esColaboradorMinisterio
} from '../../core/constants/roles.constants';

function esOrigenColaborador(origenRol?: string | null): boolean {
  return origenRol === ROLES.COLABORADOR || origenRol === ROL_LIDER_LEGACY;
}

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
    if (rol === ROLES.COLABORADOR) {
      if (aud !== 'lider') return false;
      if (n.ministerioId == null || ministerioId == null) return false;
      return Number(n.ministerioId) === Number(ministerioId);
    }
    if (rol === ROLES.ADMIN) {
      return aud === 'staff';
    }
    if (rol === ROLES.CONTABLE) {
      return aud === 'staff' && esOrigenColaborador(n.origenRol);
    }
    return false;
  });
}

export function puedeVerNotificaciones(rol: AppRole | null | undefined): boolean {
  return rol === ROLES.ADMIN || rol === ROLES.CONTABLE || esColaboradorMinisterio(rol);
}
