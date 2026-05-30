const helmet = require('helmet');

/**
 * Cabeceras HTTP de seguridad (XSS, clickjacking, MIME sniffing, etc.).
 * crossOriginResourcePolicy: cross-origin permite que el frontend consuma la API.
 */
function createHelmetMiddleware() {
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  });
}

module.exports = { createHelmetMiddleware };
