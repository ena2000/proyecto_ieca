export const environment = {
  production: false,
  /** URL base del API REST (sin barra final). */
  apiUrl: '/api',
  /**
   * true  → datos en localStorage (app funciona sin backend).
   * false → todas las peticiones van al API (poner false cuando el back esté listo).
   */
  useLocalFallback: false
};
