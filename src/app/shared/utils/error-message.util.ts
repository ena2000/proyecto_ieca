import { HttpErrorResponse } from '@angular/common/http';

const AUTH_PUBLIC_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password'
];

/**
 * Mensaje amigable para errores HTTP (red, 401, 429, validación, etc.).
 */
export function getHttpErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return (
        'No se pudo contactar el API (Render puede estar despertando o sin conexión). ' +
        'Espera hasta 1 minuto y vuelve a intentar. En Firefox a veces aparece como «CORS» con código (null), ' +
        'aunque el origen esté bien configurado.'
      );
    }
    if (error.status === 429) {
      return (
        extractBodyMessage(error) ||
        'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
      );
    }
    if (error.status === 401) {
      return extractBodyMessage(error) || 'Usuario o contraseña incorrectos.';
    }
    if (error.status === 503) {
      return (
        extractBodyMessage(error) ||
        'Servicio de correo no disponible. Configura BREVO_API_KEY o SMTP en Render.'
      );
    }
    if (error.status === 403) {
      const body = extractBodyMessage(error);
      if (body?.includes('CORS:')) {
        return (
          'El servidor rechazó el origen del navegador. En Render, CORS_ORIGINS debe incluir la URL exacta ' +
          'del frontend (p. ej. https://gestion-ieca.web.app y https://gestion-ieca.firebaseapp.com).'
        );
      }
      return body || 'No tienes permiso para esta acción.';
    }
    if (error.status >= 500) {
      return 'Error en el servidor. Intenta más tarde o contacta al administrador.';
    }
    return extractBodyMessage(error) || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function extractBodyMessage(error: HttpErrorResponse): string | null {
  const body = error.error;
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message?: string }).message;
    if (msg?.trim()) return msg;
  }
  return null;
}

/** true si el error corresponde a sesión inválida o credenciales rechazadas. */
export function isUnauthorizedHttpError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 401;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('token inválido') ||
      msg.includes('token invalido') ||
      msg.includes('no autorizado') ||
      msg.includes('sesión expirada') ||
      msg.includes('sesion expirada') ||
      msg.includes('sesión inválida') ||
      msg.includes('sesion invalida') ||
      msg.includes('credenciales incorrectas')
    );
  }
  return false;
}

export function isAuthPublicRequest(url: string): boolean {
  return AUTH_PUBLIC_PATHS.some((path) => url.includes(path));
}
