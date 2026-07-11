const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

/** Rutas públicas de auth: tienen su propio rate limit, no cuentan en el general. */
function isPublicAuthRequest(req) {
  const url = String(req.originalUrl || req.url || '');
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}

function isHealthRequest(req) {
  const url = String(req.originalUrl || req.url || '');
  return url.includes('/health');
}

/** Respuesta estándar cuando se supera el límite general del API. */
function limitHandler(_req, res) {
  res.status(429).json({
    message: 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.'
  });
}

function forgotPasswordLimitHandler(_req, res) {
  res.status(429).json({
    message:
      'Demasiadas solicitudes de código por correo. Espera unos 15 minutos e inténtalo de nuevo.'
  });
}

function resetPasswordLimitHandler(_req, res) {
  res.status(429).json({
    message: 'Demasiados intentos de restablecer contraseña. Espera unos minutos e inténtalo de nuevo.'
  });
}

function refreshLimitHandler(_req, res) {
  res.status(429).json({
    message: 'Demasiadas renovaciones de sesión. Espera un momento e inténtalo de nuevo.'
  });
}

/**
 * Protege /api/auth/login contra fuerza bruta.
 * 5 intentos por IP cada 15 minutos (configurable vía env).
 */
const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: () => Number(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
  skipSuccessfulRequests: true,
  // Sufijo opcional (tests) para no compartir contador con otras suites
  keyGenerator: (req) => {
    // IPv6-safe: no parsear IP a mano; req.ip ya viene de Express + trust proxy
    const base = String(req.ip || 'unknown');
    const suffix = process.env.RATE_LIMIT_KEY_SUFFIX || '';
    return suffix ? `${base}:${suffix}` : base;
  },
  validate: { keyGeneratorIpFallback: false }
});

/**
 * Límite para solicitar código de recuperación (correo de verificación).
 * No comparte contador con el límite general del API.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_FORGOT_WINDOW_MS) || 15 * 60 * 1000,
  max: () =>
    Number(process.env.RATE_LIMIT_FORGOT_MAX) ||
    (isProduction ? 10 : 50),
  standardHeaders: true,
  legacyHeaders: false,
  handler: forgotPasswordLimitHandler,
  /** Errores de servidor (p. ej. SMTP) no consumen intentos. */
  skipFailedRequests: true
});

/** Límite para /api/auth/reset-password (fuerza bruta de códigos). */
const resetPasswordLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_RESET_WINDOW_MS) || 15 * 60 * 1000,
  max: () => Number(process.env.RATE_LIMIT_RESET_MAX) || (isProduction ? 20 : 100),
  standardHeaders: true,
  legacyHeaders: false,
  handler: resetPasswordLimitHandler
});

/** Límite para /api/auth/refresh. */
const refreshLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_REFRESH_WINDOW_MS) || 15 * 60 * 1000,
  max: () => Number(process.env.RATE_LIMIT_REFRESH_MAX) || (isProduction ? 60 : 500),
  standardHeaders: true,
  legacyHeaders: false,
  handler: refreshLimitHandler
});

/**
 * Límite general para rutas autenticadas del API.
 * Excluye login, recuperación de contraseña y health.
 */
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_API_WINDOW_MS) || 15 * 60 * 1000,
  max: () =>
    Number(process.env.RATE_LIMIT_API_MAX) ||
    (isProduction ? 200 : 5000),
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
  skip: (req) => isPublicAuthRequest(req) || isHealthRequest(req)
});

module.exports = {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  refreshLimiter,
  apiLimiter,
  isPublicAuthRequest
};
