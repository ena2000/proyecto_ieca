/**
 * Obtiene la IP del cliente (respeta X-Forwarded-For detrás de proxy).
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0]?.trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || 'desconocida';
}

module.exports = { getClientIp };
