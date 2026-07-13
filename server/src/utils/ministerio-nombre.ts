/** Longitud máxima del nombre de ministerio (UI + API). */
const MINISTERIO_NOMBRE_MAX = 60;

/** Longitud mínima del nombre de ministerio. */
const MINISTERIO_NOMBRE_MIN = 3;

const NOMBRE_PERMITIDO = /^[\p{L}\p{N}\s\-'.&]+$/u;
const SPAM_REPETIDO = /(.)\1{4,}/u;

/**
 * Valida el nombre de un ministerio.
 * @param {unknown} nombre
 * @returns {string | null} mensaje de error o null si es válido
 */
function validarNombreMinisterio(nombre) {
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

module.exports = {
  MINISTERIO_NOMBRE_MAX,
  MINISTERIO_NOMBRE_MIN,
  validarNombreMinisterio
};
