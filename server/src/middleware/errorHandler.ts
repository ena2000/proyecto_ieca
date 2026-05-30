const { formatZodError } = require('./validate');
const { isProduction } = require('../config/env');

/**
 * Envuelve handlers async de Express y reenvía errores a next().
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  if (err.name === 'ZodError' && err.issues) {
    status = 400;
    message = formatZodError(err);
  }

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    if (isProduction) {
      message = 'Error interno del servidor';
    }
  }

  res.status(status).json({ message });
}

module.exports = { asyncHandler, errorHandler };
