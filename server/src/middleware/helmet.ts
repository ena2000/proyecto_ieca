const helmet = require('helmet');

/**
 * Cabeceras HTTP de seguridad (XSS, clickjacking, MIME sniffing, CSP, etc.).
 * crossOriginResourcePolicy: cross-origin permite que el frontend consuma la API.
 * CSP estricta en respuestas JSON de la API (no sirve HTML).
 */
function createHelmetMiddleware() {
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        objectSrc: ["'none'"]
      }
    }
  });
}

module.exports = { createHelmetMiddleware };
