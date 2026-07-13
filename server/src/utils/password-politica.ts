/**
 * Política de contraseñas al crear/cambiar (alineada con el frontend).
 * El login NO usa esto: permite credenciales antiguas más débiles.
 */

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const PASSWORDS_DEBILES = new Set([
  '12345678',
  '123456789',
  'password',
  'password1',
  'password12',
  'password123',
  'qwerty12',
  'qwerty123',
  'abcdefgh',
  'abcdefg1',
  '11111111',
  '00000000',
  'ieca1234',
  'admin123',
  'usuario1'
]);

function mensajeErrorPasswordNueva(password, etiqueta = 'contraseña') {
  const raw = String(password ?? '');
  const t = raw.trim();
  if (!raw) return `La ${etiqueta} es obligatoria.`;
  if (!t) return `La ${etiqueta} no puede ser solo espacios.`;
  if (t.length < PASSWORD_MIN) {
    return `La ${etiqueta} debe tener al menos ${PASSWORD_MIN} caracteres.`;
  }
  if (t.length > PASSWORD_MAX) {
    return `La ${etiqueta} no puede superar ${PASSWORD_MAX} caracteres.`;
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) {
    return `La ${etiqueta} debe incluir al menos una letra.`;
  }
  if (!/[0-9]/.test(t)) {
    return `La ${etiqueta} debe incluir al menos un número.`;
  }
  if (PASSWORDS_DEBILES.has(t.toLowerCase())) {
    return `Elige una ${etiqueta} menos predecible.`;
  }
  return null;
}

function esPasswordNuevaValida(password) {
  return mensajeErrorPasswordNueva(password) === null;
}

/** Refinamiento Zod reutilizable. */
function refinePasswordNueva(password, ctx) {
  const msg = mensajeErrorPasswordNueva(password, 'contraseña');
  if (msg) {
    ctx.addIssue({ code: 'custom', message: msg });
  }
}

module.exports = {
  PASSWORD_MIN,
  PASSWORD_MAX,
  mensajeErrorPasswordNueva,
  esPasswordNuevaValida,
  refinePasswordNueva
};
