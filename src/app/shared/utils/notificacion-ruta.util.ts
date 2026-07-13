/** Construye la ruta de notificación hacia un registro concreto. */
export function rutaNotificacionRegistro(
  tipo: 'ingreso' | 'gasto' | 'cierre',
  entityId?: number | string | null
): string {
  if (tipo === 'cierre') return '/administracion';
  const base = tipo === 'gasto' ? '/gastos' : '/ingresos';
  if (entityId == null || entityId === '') return base;
  return `${base}?id=${encodeURIComponent(String(entityId))}`;
}

/** Path sin query (`/ingresos?id=3` → `/ingresos`). */
export function pathnameNotificacion(ruta: string | null | undefined): string {
  return String(ruta || '').split('?')[0];
}

export function leerIdRegistroDesdeQuery(param: string | null): string | null {
  const v = String(param ?? '').trim();
  return v || null;
}
