import { SessionUser } from '../models';

export interface LocalLoginResult {
  success: boolean;
  mensaje?: string;
}

/**
 * Stub de producción: no incluye credenciales ni lógica offline.
 * Sustituye a auth-local.fallback.ts en el build de producción (angular.json).
 */
export function loginLocalFallback(
  _usuario: string,
  _password: string,
  _persistSession: (token: string, refreshToken: string, user: SessionUser) => void
): Promise<LocalLoginResult> {
  return Promise.resolve({
    success: false,
    mensaje: 'El modo offline no está disponible. Conéctate al servidor API.'
  });
}
