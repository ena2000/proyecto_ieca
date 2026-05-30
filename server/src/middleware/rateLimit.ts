const rateLimit = require('express-rate-limit');

/** Respuesta estándar cuando se supera el límite. */
function limitHandler(_req, res) {
  res.status(429).json({
    message: 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.'
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

/** Límite para solicitar código de recuperación (3 / hora por IP). */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_FORGOT_MAX) || 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

/**
 * Límite general para el resto del API autenticado.
 * 200 peticiones por IP cada 15 minutos.
 */
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_API_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

module.exports = { loginLimiter, forgotPasswordLimiter, apiLimiter };
