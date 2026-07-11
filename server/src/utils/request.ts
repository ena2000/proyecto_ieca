/**
 * Obtiene la IP del cliente. Con trust proxy, preferir req.ip (no spoofable por el cliente).
 */
function getClientIp(req) {
  if (req.ip) return req.ip;
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || 'desconocida';
}

module.exports = { getClientIp };
