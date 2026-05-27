export const API = {
  auth: {
    login:  '/auth/login',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    me:     '/auth/me'
  },
  ingresos:     '/ingresos',
  gastos:       '/gastos',
  ministerios:  '/ministerios',
  usuarios:     '/usuarios',
  notificaciones: '/notificaciones',
  reportes:     '/reportes',
  cierres:      '/cierres'
} as const;
