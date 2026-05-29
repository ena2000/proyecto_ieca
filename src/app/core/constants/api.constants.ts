export const API = {
  auth: {
    login:  '/auth/login',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    me:     '/auth/me'
  },
  ingresos: {
    base:     '/ingresos',
    aprobar:  (id: number) => `/ingresos/${id}/aprobar`,
    rechazar: (id: number) => `/ingresos/${id}/rechazar`
  },
  gastos: {
    base:     '/gastos',
    aprobar:  (id: number) => `/gastos/${id}/aprobar`,
    rechazar: (id: number) => `/gastos/${id}/rechazar`
  },
  ministerios:  '/ministerios',
  usuarios:     '/usuarios',
  notificaciones: {
    base:           '/notificaciones',
    marcarTodas:    '/notificaciones/marcar-todas',
    marcarPorRuta:  '/notificaciones/marcar-por-ruta',
    marcarPorTipo:  '/notificaciones/marcar-por-tipo',
    marcarLeida:    (id: string) => `/notificaciones/${id}/leida`
  },
  reportes:     '/reportes',
  cierres:      '/cierres',
  admin: {
    config:  '/admin/config',
    backup:  '/admin/backup',
    restore: '/admin/restore',
    datos:   '/admin/datos',
    cierre:  '/admin/cierre',
    auditoria: '/admin/auditoria'
  }
} as const;
