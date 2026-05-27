export interface SessionUser {
  id: string;
  usuario: string;
  email?: string;
  rol?: string;
  ministerioId?: number;
  mustChangePassword?: boolean;
}
