export interface AccesoRapidoAdmin {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

export const ACCESOS_RAPIDOS_ADMIN: AccesoRapidoAdmin[] = [
  {
    titulo: 'Usuarios',
    descripcion: 'Cuentas y permisos de acceso',
    icono: 'people-outline',
    ruta: '/usuarios',
    color: 'blue'
  },
  {
    titulo: 'Ministerios',
    descripcion: 'Departamentos y liderazgos',
    icono: 'business-outline',
    ruta: '/ministerios',
    color: 'purple'
  },
  {
    titulo: 'Ingresos',
    descripcion: 'Ofrendas, diezmos y entradas',
    icono: 'trending-up-outline',
    ruta: '/ingresos',
    color: 'green'
  },
  {
    titulo: 'Gastos',
    descripcion: 'Egresos y compras autorizadas',
    icono: 'trending-down-outline',
    ruta: '/gastos',
    color: 'red'
  },
  {
    titulo: 'Reportes',
    descripcion: 'Balances y estados financieros',
    icono: 'stats-chart-outline',
    ruta: '/reportes',
    color: 'orange'
  }
];
