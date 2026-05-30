const cors = require('cors');
const { CORS_ORIGINS } = require('../config/env');

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
      if (CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origen no permitido (${origin})`));
    },
    credentials: true
  });
}

module.exports = { createCorsMiddleware, CORS_ORIGINS };
