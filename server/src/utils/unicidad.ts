const { listCollection } = require('./firestore');
const { normalizeEmail } = require('./email-normalize');
const { esMinisterioExcluidoCatalogo } = require('../constants/ministerios-catalogo');

function normalizarTextoUnico(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function crearErrorUnicidad(message: string, status = 409) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function assertMinisterioNombreUnico(nombre: unknown, excludeId: number | null = null) {
  const clave = normalizarTextoUnico(nombre);
  if (!clave) return;

  if (esMinisterioExcluidoCatalogo(String(nombre))) {
    throw crearErrorUnicidad(
      'Este nombre está reservado y no puede usarse como ministerio operativo.'
    );
  }

  const ministerios = await listCollection('ministerios');
  const duplicado = ministerios.find(m => {
    if (excludeId != null && Number(m.id) === Number(excludeId)) return false;
    return normalizarTextoUnico(m.nombre) === clave;
  });

  if (duplicado) {
    throw crearErrorUnicidad(`Ya existe un ministerio con el nombre "${duplicado.nombre}".`);
  }
}

async function assertUsuarioEmailUnico(email: unknown, excludeId: number | null = null) {
  const clave = normalizeEmail(email);
  if (!clave) return;

  const usuarios = await listCollection('usuarios');
  const duplicado = usuarios.find(u => {
    if (excludeId != null && Number(u.id) === Number(excludeId)) return false;
    return normalizeEmail(u.email) === clave;
  });

  if (duplicado) {
    throw crearErrorUnicidad(`Ya existe un usuario con el email "${duplicado.email}".`);
  }
}

async function assertUsuarioLoginUnico(usuario: unknown, excludeId: number | null = null) {
  const clave = normalizarTextoUnico(usuario);
  if (!clave) return;

  const usuarios = await listCollection('usuarios');
  const duplicado = usuarios.find(u => {
    if (excludeId != null && Number(u.id) === Number(excludeId)) return false;
    return normalizarTextoUnico(u.usuario) === clave;
  });

  if (duplicado) {
    throw crearErrorUnicidad(`Ya existe un usuario con el login "${duplicado.usuario}".`);
  }
}

module.exports = {
  normalizarTextoUnico,
  assertMinisterioNombreUnico,
  assertUsuarioEmailUnico,
  assertUsuarioLoginUnico
};
