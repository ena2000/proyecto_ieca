/** Decodifica el payload JWT (sin verificar firma; solo expiración en cliente). */
export function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

/** true si el token no es JWT válido o ya expiró (con margen opcional). */
export function isJwtExpired(token: string | null | undefined, leewaySec = 30): boolean {
  if (!token?.trim()) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp - leewaySec) * 1000;
}
