const cors = require('cors');
const { CORS_ORIGINS } = require('../config/env');

function normalizarOrigen(origin) {
  return String(origin ?? '').trim().replace(/\/$/, '');
}

const ORIGENES_PERMITIDOS = new Set(CORS_ORIGINS.map(normalizarOrigen));

/**
 * Solo permite peticiones desde orígenes explícitos (navegador).
 * Peticiones sin header Origin (Postman, curl, apps nativas) se permiten.
 */
function createCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      const normalizado = normalizarOrigen(origin);
      if (ORIGENES_PERMITIDOS.has(normalizado)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Origen rechazado: ${origin}. Permitidos: ${[...ORIGENES_PERMITIDOS].join(', ')}`);
      return callback(new Error(`CORS: origen no permitido (${origin})`));
    },
    credentials: true,
    optionsSuccessStatus: 204
  });
}

module.exports = { createCorsMiddleware, CORS_ORIGINS };
