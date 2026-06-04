/** Normaliza email para búsqueda y almacenamiento consistente. */
function normalizeEmail(email) {
  if (email == null || email === '') return null;
  const s = String(email).trim().toLowerCase();
  return s || null;
}

module.exports = { normalizeEmail };
