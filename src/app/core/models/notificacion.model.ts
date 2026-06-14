export type NotificacionTipo = 'ingreso' | 'gasto' | 'cierre';
export type NotificacionAudiencia = 'staff' | 'colaborador';

export interface Notificacion {
  id: string;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  ruta?: string;
  fecha: string;
  /** staff = admin/contable; colaborador = resolución de movimientos del ministerio. */
  audiencia?: NotificacionAudiencia;
  /** Quién originó la acción (p. ej. Colaborador). El contable solo ve staff con origen del colaborador. */
  origenRol?: string;
  ministerioId?: number;
  /** Usuario que ejecutó la acción; no debe ver esta notificación. */
  actorUserId?: string;
  leidasPor: string[];
}
