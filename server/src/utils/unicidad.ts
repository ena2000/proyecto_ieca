const { listCollection } = require('./firestore');
const { normalizeEmail } = require('./email-normalize');
const { esMinisterioExcluidoCatalogo } = require('../constants/ministerios-catalogo');

function normalizarTextoUnico(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const PREFIJOS_MINISTERIO = [
  /^el ministerio de(?:l)?\s+/,
  /^ministerio de(?:l)?\s+/,
  /^ministerio\s+/,
  /^area de(?:l)?\s+/,
  /^departamento de(?:l)?\s+/,
  /^depto\.?\s+(?:de\s+)?/,
  /^grupo de(?:l)?\s+/,
  /^equipo de(?:l)?\s+/
];

/** Clave comparable: sin tildes/mayúsculas y sin prefijos tipo «ministerio de». */
function claveMinisterioNombre(value) {
  let clave = normalizarTextoUnico(value);
  if (!clave) return '';

  let changed = true;
  while (changed) {
    changed = false;
    for (const re of PREFIJOS_MINISTERIO) {
      const next = clave.replace(re, '').trim();
      if (next !== clave) {
        clave = next;
        changed = true;
      }
    }
  }
  return clave;
}

function crearErrorUnicidad(message, status = 409) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function assertMinisterioNombreUnico(nombre, excludeId = null) {
  const clave = claveMinisterioNombre(nombre);
  if (!clave) return;

  if (esMinisterioExcluidoCatalogo(String(nombre))) {
    throw crearErrorUnicidad(
      'Este nombre está reservado y no puede usarse como ministerio operativo.'
    );
  }

  const ministerios = await listCollection('ministerios');
  const duplicado = ministerios.find(m => {
    if (excludeId != null && Number(m.id) === Number(excludeId)) return false;
    return claveMinisterioNombre(m.nombre) === clave;
  });

  if (duplicado) {
    throw crearErrorUnicidad(
      `Ya existe un ministerio con el nombre "${duplicado.nombre}" (o uno equivalente).`
    );
  }
}

async function assertUsuarioEmailUnico(email, excludeId = null) {
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

async function assertUsuarioLoginUnico(usuario, excludeId = null) {
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
  claveMinisterioNombre,
  assertMinisterioNombreUnico,
  assertUsuarioEmailUnico,
  assertUsuarioLoginUnico
};
