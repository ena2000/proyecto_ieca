const { listCollection } = require('./firestore');
const { MINISTERIO_IGLESIA_NOMBRE } = require('../constants/aportacion-iglesia');

/** Resuelve nombre por id primero; el texto del cliente solo es fallback. */
async function resolverNombreMinisterio(ministerioId: unknown, ministerioNombre: unknown): Promise<string> {
  const id = Number(ministerioId);
  if (Number.isFinite(id) && id > 0) {
    const ministerios = await listCollection('ministerios');
    const m = ministerios.find((row) => Number(row.id) === id);
    if (m?.nombre) return String(m.nombre).trim();
  }
  return String(ministerioNombre ?? '').trim();
}

async function esMinisterioIglesia(ministerioId: unknown, ministerioNombre: unknown): Promise<boolean> {
  const nombre = await resolverNombreMinisterio(ministerioId, ministerioNombre);
  return nombre.toLowerCase() === MINISTERIO_IGLESIA_NOMBRE.toLowerCase();
}

async function assertMinisterioPermiteGastos(body: { ministerioId?: unknown; ministerio?: unknown }) {
  if (await esMinisterioIglesia(body?.ministerioId, body?.ministerio)) {
    const err = new Error(
      'El ministerio General solo acumula ingresos de aportación iglesia (33 %); no admite gastos.'
    );
    err.status = 400;
    throw err;
  }
}

async function assertMinisterioPermiteIngresoManual(body: {
  ministerioId?: unknown;
  ministerio?: unknown;
  esAportacionIglesia?: boolean;
}) {
  if (body?.esAportacionIglesia) return;
  if (await esMinisterioIglesia(body?.ministerioId, body?.ministerio)) {
    const err = new Error(
      'El ministerio General solo recibe ingresos automáticos de aportación (33 %); no puedes registrar ingresos manuales ahí.'
    );
    err.status = 400;
    throw err;
  }
}

module.exports = {
  assertMinisterioPermiteGastos,
  assertMinisterioPermiteIngresoManual,
  esMinisterioIglesia,
  resolverNombreMinisterio
};
