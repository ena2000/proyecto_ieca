/** Longitud máxima del nombre de ministerio (UI + API). */
export const MINISTERIO_NOMBRE_MAX = 60;

/** Longitud mínima del nombre de ministerio. */
export const MINISTERIO_NOMBRE_MIN = 3;

/**
 * Letras, números, espacios, guion, apóstrofe, punto y &.
 * Evita spam tipo `***` o cadenas sin sentido de símbolos.
 */
const NOMBRE_PERMITIDO = /^[\p{L}\p{N}\s\-'.&]+$/u;

/** Misma letra/símbolo repetido 5+ veces seguidas (sin espacios). */
const SPAM_REPETIDO = /(.)\1{4,}/u;

/**
 * Valida el nombre de un ministerio.
 * @returns mensaje de error o `null` si es válido.
 */
export function validarNombreMinisterio(nombre: unknown): string | null {
  const t = String(nombre ?? '').trim();

  if (t.length < MINISTERIO_NOMBRE_MIN) {
    return `El nombre del ministerio debe tener al menos ${MINISTERIO_NOMBRE_MIN} caracteres.`;
  }
  if (t.length > MINISTERIO_NOMBRE_MAX) {
    return `El nombre no puede superar ${MINISTERIO_NOMBRE_MAX} caracteres.`;
  }
  if (!/\p{L}/u.test(t)) {
    return 'El nombre debe incluir al menos una letra.';
  }
  if (!NOMBRE_PERMITIDO.test(t)) {
    return 'Usa solo letras, números, espacios, guiones o apóstrofes.';
  }
  if (SPAM_REPETIDO.test(t.replace(/\s/g, ''))) {
    return 'El nombre no puede repetir el mismo carácter tantas veces.';
  }
  return null;
}
