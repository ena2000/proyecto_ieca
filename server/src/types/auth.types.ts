export type AppRole = 'Administrador' | 'Contable' | 'Lider/CoLider';

export interface AuthUser {
  id: number | string;
  rol: AppRole | string;
  ministerioId?: number | null;
  usuario?: string;
  email?: string;
  mustChangePassword?: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  rol: string;
  ministerioId: number | null;
  type: 'access';
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}
