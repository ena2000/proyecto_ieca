import { SessionUser } from './auth.model';

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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
