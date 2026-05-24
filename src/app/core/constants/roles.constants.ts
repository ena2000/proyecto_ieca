export const ROLES = {
  ADMIN: 'Administrador',
  CONTABLE: 'Contable',
  LIDER: 'Lider/CoLider'
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Rutas permitidas por rol (sin barra final). */
export const RUTAS_POR_ROL: Record<AppRole, string[]> = {
  [ROLES.ADMIN]: [
    '/dashboard',
    '/ministerios',
    '/ingresos',
    '/gastos',
    '/reportes',
    '/usuarios',
    '/administracion'
  ],
  [ROLES.CONTABLE]: ['/dashboard', '/ingresos', '/gastos', '/reportes'],
  [ROLES.LIDER]: ['/dashboard', '/ingresos', '/gastos', '/reportes']
};

export function normalizarRol(rol?: string | null): AppRole | null {
  if (!rol) return null;
  const r = rol.trim().toLowerCase();
  if (r === 'administrador' || r === 'admin') return ROLES.ADMIN;
  if (r === 'contable') return ROLES.CONTABLE;
  if (r === 'lider/colider' || r === 'lider' || r === 'colider' || r === 'co-lider') {
    return ROLES.LIDER;
  }
  if (rol === ROLES.ADMIN || rol === ROLES.CONTABLE || rol === ROLES.LIDER) {
    return rol as AppRole;
  }
  return null;
}

export function puedeAccederRuta(rol: AppRole | null, ruta: string): boolean {
  if (!rol) return false;
  const path = ruta.split('?')[0];
  return (RUTAS_POR_ROL[rol] ?? []).includes(path);
}

export function rutaPorDefecto(rol: AppRole | null): string {
  return '/dashboard';
}
