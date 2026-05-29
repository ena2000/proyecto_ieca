export interface ResumenAdmin {
  label: string;
  valor: string;
  icono: string;
  color: string;
  sub: string;
}

export interface ActividadAdmin {
  accion: string;
  modulo: string;
  tiempo: string;
  icono: string;
  color: string;
}

export interface ConfigIglesia {
  nombre: string;
  periodoActual: string;
  version: string;
}

export interface BackupIeca {
  fecha: string;
  version: string;
  ingresos: unknown[];
  gastos: unknown[];
  ministerios: unknown[];
  usuarios: unknown[];
  notificaciones?: unknown[];
  ultimoCierre: string | null;
}
