import { HttpErrorResponse } from '@angular/common/http';

const AUTH_PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];

/**
 * Mensaje amigable para errores HTTP (red, 401, 429, validación, etc.).
 */
export function getHttpErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Sin conexión con el servidor. Verifica tu internet o que el API esté activo.';
    }
    if (error.status === 429) {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }
    if (error.status === 401) {
      return extractBodyMessage(error) || 'Sesión expirada o credenciales incorrectas.';
    }
    if (error.status === 403) {
      return extractBodyMessage(error) || 'No tienes permiso para esta acción.';
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

export function isAuthPublicRequest(url: string): boolean {
  return AUTH_PUBLIC_PATHS.some((path) => url.includes(path));
}
