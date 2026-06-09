const TTL_MS = 60_000;
const cache = new Map<string, { at: number; payload: Record<string, unknown> }>();

function cacheKey(user: { sub?: string; rol?: string; ministerioId?: number | null }) {
  return `${user?.sub ?? '?'}:${user?.rol ?? '?'}:${user?.ministerioId ?? 'all'}`;
}

function getCachedBootstrap(user: { sub?: string; rol?: string; ministerioId?: number | null }) {
  const hit = cache.get(cacheKey(user));
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(cacheKey(user));
    return null;
  }
  return hit.payload;
}

function setCachedBootstrap(
  user: { sub?: string; rol?: string; ministerioId?: number | null },
  payload: Record<string, unknown>
) {
  cache.set(cacheKey(user), { at: Date.now(), payload });
}

function invalidateBootstrapCache() {
  cache.clear();
}

module.exports = {
  getCachedBootstrap,
  setCachedBootstrap,
  invalidateBootstrapCache
};
