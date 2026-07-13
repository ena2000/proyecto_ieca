/**
 * Dominios de correo permitidos (Gmail, Outlook, Hotmail, Yahoo, etc.).
 * Debe mantenerse alineado con `usuario-validacion.util.ts` del frontend.
 */
const EMAIL_DOMINIOS_PERMITIDOS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.es',
  'hotmail.com',
  'hotmail.es',
  'live.com',
  'live.com.mx',
  'msn.com',
  'yahoo.com',
  'yahoo.es',
  'yahoo.com.mx',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'gmx.es',
  'mail.com',
  // Solo datos demo / cuentas de prueba del sistema
  'ieca.demo',
  'ieca.com'
];

const EMAIL_FORMATO = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

function dominioEmail(email) {
  const e = String(email ?? '').trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return null;
  return e.slice(at + 1);
}

function esEmailProveedorConocido(email) {
  const e = String(email ?? '').trim().toLowerCase();
  if (e.length < 6 || e.length > 200) return false;
  if (!EMAIL_FORMATO.test(e)) return false;
  const dominio = dominioEmail(e);
  return !!(dominio && EMAIL_DOMINIOS_PERMITIDOS.includes(dominio));
}

module.exports = {
  EMAIL_DOMINIOS_PERMITIDOS,
  esEmailProveedorConocido
};
