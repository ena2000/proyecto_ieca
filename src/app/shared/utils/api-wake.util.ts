import { environment } from '../../../environments/environment';

const RETRY_MS = 2_000;

function healthUrl(): string {
  const base = environment.apiUrl.replace(/\/$/, '');
  return `${base}/health`;
}

/** Ping /health hasta que responda o se agote el tiempo (Render cold start). */
export async function esperarApiDisponible(maxWaitMs = 50_000): Promise<boolean> {
  if (!environment.production || environment.useLocalFallback) {
    return true;
  }

  const url = healthUrl();
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
      if (res.ok) {
        return true;
      }
    } catch {
      // Render aún despertando
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_MS));
  }

  return false;
}

/** Despierta el API en segundo plano al abrir pantallas de auth. */
export function despertarApiEnSegundoPlano(): void {
  if (!environment.production || environment.useLocalFallback) {
    return;
  }
  void fetch(healthUrl(), { mode: 'cors', cache: 'no-store' }).catch(() => undefined);
}
