/** Validaciones compartidas de usuarios / autenticación (defensa ante vacío o basura). */

export const USUARIO_NOMBRE_MIN = 3;
export const USUARIO_NOMBRE_MAX = 200;
/** Longitud mínima al crear o cambiar contraseña. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const PASSWORD_HINT =
  'Mín. 8 caracteres, con al menos una letra y un número';

const NOMBRE_PERSONA = /^[\p{L}\s.'-]+$/u;

/** Contraseñas demasiado obvias (comparación en minúsculas). */
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

/**
 * Dominios de correo permitidos (proveedores conocidos).
 * Evita emails inventados tipo a@b.c o dominio falso.
 */
export const EMAIL_DOMINIOS_PERMITIDOS = [
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'outlook.com',
  'outlook.es',
  'hotmail.com',
  'hotmail.es',
  'live.com',
  'live.com.mx',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.es',
  'yahoo.com.mx',
  'ymail.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // Otros de uso frecuente
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'gmx.es',
  'mail.com',
  // Solo datos demo / cuentas de prueba del sistema (no son proveedores reales)
  'ieca.demo',
  'ieca.com'
] as const;

const EMAIL_FORMATO = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function dominioEmail(email: unknown): string | null {
  const e = String(email ?? '').trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return null;
  return e.slice(at + 1);
}

/** Email con formato correcto y dominio de proveedor conocido (Gmail, Outlook, etc.). */
export function esEmailValido(email: unknown): boolean {
  const e = String(email ?? '').trim().toLowerCase();
  if (e.length < 6 || e.length > 200) return false;
  if (!EMAIL_FORMATO.test(e)) return false;
  const dominio = dominioEmail(e);
  if (!dominio) return false;
  return (EMAIL_DOMINIOS_PERMITIDOS as readonly string[]).includes(dominio);
}

export function mensajeErrorEmail(email: unknown): string | null {
  const e = String(email ?? '').trim();
  if (!e) return 'El correo es obligatorio.';
  if (!EMAIL_FORMATO.test(e.toLowerCase())) {
    return 'Ingresa un correo válido (ej. nombre@gmail.com).';
  }
  if (!esEmailValido(e)) {
    return 'Usa un correo de Gmail, Outlook, Hotmail, Yahoo u otro proveedor conocido.';
  }
  return null;
}

export function mensajeErrorNombrePersona(nombre: unknown): string | null {
  const t = String(nombre ?? '').trim();
  if (t.length < USUARIO_NOMBRE_MIN) {
    return `El nombre debe tener al menos ${USUARIO_NOMBRE_MIN} caracteres.`;
  }
  if (t.length > USUARIO_NOMBRE_MAX) {
    return `El nombre no puede superar ${USUARIO_NOMBRE_MAX} caracteres.`;
  }
  if (!NOMBRE_PERSONA.test(t)) {
    return 'Usa solo letras y espacios en el nombre.';
  }
  if (/[<>]/.test(t)) {
    return 'Quita caracteres no permitidos del nombre.';
  }
  return null;
}

/** Contraseña al crear/cambiar: longitud, letra, número; rechaza solo espacios y claves obvias. */
export function esPasswordValida(password: unknown, min = PASSWORD_MIN): boolean {
  return mensajeErrorPassword(password, min) === null;
}

/** Solo comprueba que haya texto real (p. ej. contraseña actual al cambiar). */
export function mensajeErrorPasswordActual(password: unknown): string | null {
  const raw = String(password ?? '');
  if (!raw) return 'La contraseña actual es obligatoria.';
  if (!raw.trim()) return 'La contraseña actual no puede ser solo espacios.';
  return null;
}

export function mensajeErrorPassword(
  password: unknown,
  min = PASSWORD_MIN,
  etiqueta = 'contraseña'
): string | null {
  const raw = String(password ?? '');
  const t = raw.trim();
  if (!raw) return `La ${etiqueta} es obligatoria.`;
  if (!t) return `La ${etiqueta} no puede ser solo espacios.`;
  if (t.length < min) {
    return `La ${etiqueta} debe tener al menos ${min} caracteres.`;
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

export const ESTADOS_MINISTERIO = ['Activo', 'Pausado', 'Inactivo'] as const;
export type EstadoMinisterio = (typeof ESTADOS_MINISTERIO)[number];

export function esEstadoMinisterioValido(estado: unknown): estado is EstadoMinisterio {
  return ESTADOS_MINISTERIO.includes(String(estado ?? '').trim() as EstadoMinisterio);
}

/** Estructura mínima de un backup IECA antes de enviarlo al API. */
export function mensajeErrorBackupIeca(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') {
    return 'El archivo no es un respaldo IECA válido.';
  }
  const b = obj as Record<string, unknown>;
  if (!b['version']) {
    return 'El archivo no es un respaldo IECA válido (falta version).';
  }
  for (const key of ['ingresos', 'gastos', 'ministerios', 'usuarios'] as const) {
    if (!Array.isArray(b[key])) {
      return `El archivo no es un respaldo IECA válido (falta la lista «${key}»).`;
    }
  }
  return null;
}
