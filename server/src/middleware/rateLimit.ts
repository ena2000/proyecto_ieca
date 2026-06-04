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

/**
 * Protege /api/auth/login contra fuerza bruta.
 * 5 intentos por IP cada 15 minutos (configurable vía env).
 */
const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
  skipSuccessfulRequests: true
});

/**
 * Límite para solicitar código de recuperación (correo de verificación).
 * No comparte contador con el límite general del API.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_FORGOT_WINDOW_MS) || 15 * 60 * 1000,
  max:
    Number(process.env.RATE_LIMIT_FORGOT_MAX) ||
    (isProduction ? 10 : 50),
  standardHeaders: true,
  legacyHeaders: false,
  handler: forgotPasswordLimitHandler,
  /** Errores de servidor (p. ej. SMTP) no consumen intentos. */
  skipFailedRequests: true
});

/**
 * Límite general para rutas autenticadas del API.
 * Excluye login, recuperación de contraseña y health.
 */
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_API_WINDOW_MS) || 15 * 60 * 1000,
  max:
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
  apiLimiter,
  isPublicAuthRequest
};
