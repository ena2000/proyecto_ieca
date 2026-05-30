export type MovimientoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface FirestoreEntity {
  id?: number | string;
  [key: string]: unknown;
}

export interface UsuarioDoc extends FirestoreEntity {
  usuario?: string;
  email?: string;
  nombre?: string;
  rol?: string;
  estado?: string;
  ministerioId?: number;
  passwordHash?: string;
  mustChangePassword?: boolean;
}

export interface LoginAuditDoc extends FirestoreEntity {
  success?: boolean;
  ip?: string;
  usuario?: string;
  reason?: string;
}
