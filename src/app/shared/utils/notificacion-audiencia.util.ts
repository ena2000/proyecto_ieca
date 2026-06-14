import { NotificacionAudiencia } from '../../core/models/notificacion.model';

/** Normaliza audiencia legacy (`lider`) al término actual (`colaborador`). */
export function normalizarAudiencia(aud?: string | null): NotificacionAudiencia {
  if (aud === 'colaborador' || aud === 'lider') return 'colaborador';
  return 'staff';
}

/** Valor persistido en API/Firestore (acepta legacy en lectura, escribe solo valores actuales). */
export function audienciaParaGuardar(aud?: string | null): NotificacionAudiencia {
  return normalizarAudiencia(aud);
}
