import { SessionUser } from './auth.model';
import { Gasto } from './gasto.model';
import { Ingreso } from './ingreso.model';
import { Ministerio } from './ministerio.model';
import { Usuario } from './usuario.model';
import { Notificacion } from './notificacion.model';

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: SessionUser;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
}

/** Respuesta de GET /api/bootstrap (carga inicial en una petición). */
export interface BootstrapResponse {
  ingresos?: Ingreso[];
  gastos?: Gasto[];
  ministerios?: Ministerio[];
  usuarios?: Usuario[];
  notificaciones?: Notificacion[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
