/**
 * Almacenamiento de sesión JWT en el navegador.
 * Usa sessionStorage (se limpia al cerrar la ventana) y migra una vez desde localStorage
 * si el usuario tenía sesión previa. El flujo sigue siendo Bearer JWT en cliente
 * (sin cambiar la arquitectura documentada).
 */

export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_REFRESH_KEY = 'auth_refresh_token';
export const AUTH_USER_KEY = 'user_data';

const AUTH_KEYS = [AUTH_TOKEN_KEY, AUTH_REFRESH_KEY, AUTH_USER_KEY] as const;

function migrateKeyFromLocalStorage(key: string): void {
  try {
    if (sessionStorage.getItem(key) != null) {
      localStorage.removeItem(key);
      return;
    }
    const legacy = localStorage.getItem(key);
    if (legacy == null) return;
    sessionStorage.setItem(key, legacy);
    localStorage.removeItem(key);
  } catch {
    /* storage no disponible (modo privado estricto, etc.) */
  }
}

export function authStorageGet(key: string): string | null {
  try {
    migrateKeyFromLocalStorage(key);
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function authStorageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function authStorageRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function authStorageClearSession(): void {
  for (const key of AUTH_KEYS) {
    authStorageRemove(key);
  }
}
