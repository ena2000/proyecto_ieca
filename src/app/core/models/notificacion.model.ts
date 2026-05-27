export type NotificacionTipo = 'ingreso' | 'gasto' | 'cierre';

export interface Notificacion {
  id: string;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  ruta?: string;
  fecha: string;
  /** IDs de sesión (admin, contable) que ya vieron la notificación. */
  leidasPor: string[];
}
