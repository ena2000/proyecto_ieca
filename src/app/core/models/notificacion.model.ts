export type NotificacionTipo = 'ingreso' | 'gasto' | 'cierre';
export type NotificacionAudiencia = 'staff' | 'lider';

export interface Notificacion {
  id: string;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  ruta?: string;
  fecha: string;
  /** staff = admin/contable; lider = resolución de movimientos del ministerio. */
  audiencia?: NotificacionAudiencia;
  ministerioId?: number;
  /** Usuario que ejecutó la acción; no debe ver esta notificación. */
  actorUserId?: string;
  leidasPor: string[];
}
