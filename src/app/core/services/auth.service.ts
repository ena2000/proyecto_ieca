import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of, timeout, TimeoutError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { SessionUser, LoginResponse, RefreshTokenResponse } from '../models';
import {
  AppRole,
  ROLES,
  normalizarRol,
  puedeAccederRuta,
  rutaPorDefecto
} from '../constants/roles.constants';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { environment } from '../../../environments/environment';
import { loginLocalFallback } from './auth-local.fallback';

interface LoginResult {
  success: boolean;
  mensaje?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  codeDispatched?: boolean;
  emailSent?: boolean;
  channel?: 'email' | 'console' | 'none';
  devCode?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_KEY = 'auth_refresh_token';
  private readonly USER_KEY  = 'user_data';

  private refreshInFlight: Promise<boolean> | null = null;

  private sessionSubject = new BehaviorSubject<SessionUser | null>(this.loadSession());
  readonly session$: Observable<SessionUser | null> = this.sessionSubject.asObservable();

  constructor(private api: ApiService) {}

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY) && !!this.sessionSubject.getValue();
  }

  getSession(): SessionUser | null {
    return this.sessionSubject.getValue();
  }

  getRol(): AppRole | null {
    return normalizarRol(this.getSession()?.rol);
  }

  isAdministrador(): boolean {
    return this.getRol() === ROLES.ADMIN;
  }

  isContable(): boolean {
    return this.getRol() === ROLES.CONTABLE;
  }

  isLider(): boolean {
    return this.getRol() === ROLES.LIDER;
  }

  isSoloLecturaFinanzas(): boolean {
    return this.isContable();
  }

  getMinisterioScopeId(): number | null {
    const id = this.getSession()?.ministerioId;
    return this.isLider() && id != null ? Number(id) : null;
  }

  puedeAccederRuta(ruta: string): boolean {
    return puedeAccederRuta(this.getRol(), ruta);
  }

  getRutaPorDefecto(): string {
    if (this.getSession()?.mustChangePassword) return '/cambiar-password';
    return rutaPorDefecto(this.getRol());
  }

  login(usuario: string, password: string): Promise<LoginResult> {
    if (environment.useLocalFallback) {
      return loginLocalFallback(usuario, password, (token, refreshToken, user) =>
        this.persistSession(token, refreshToken, user)
      );
    }
    return firstValueFrom(
      this.api.post<LoginResponse>(API.auth.login, { usuario, password }).pipe(
        timeout(90_000),
        tap(res => this.persistSession(res.token, res.refreshToken, res.user)),
        map(() => ({ success: true } as LoginResult)),
        catchError(err => of({
          success: false,
          mensaje: err instanceof TimeoutError
            ? 'El servidor tarda en responder (arranque en Render). Espera un momento e inténtalo de nuevo.'
            : (err?.message ?? 'Usuario o contraseña incorrectos')
        } as LoginResult))
      )
    );
  }

  logout(): void {
    if (!environment.useLocalFallback) {
      this.api.post(API.auth.logout, {}).subscribe({ error: () => undefined });
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.sessionSubject.next(null);
  }

  /** Renueva el access token usando el refresh token almacenado. */
  refreshAccessToken(): Promise<boolean> {
    if (environment.useLocalFallback) {
      return Promise.resolve(!!localStorage.getItem(this.TOKEN_KEY));
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) {
      return Promise.resolve(false);
    }

    this.refreshInFlight = firstValueFrom(
      this.api.post<RefreshTokenResponse>(API.auth.refresh, { refreshToken }).pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
        }),
        map(() => true),
        catchError(() => of(false))
      )
    ).finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return firstValueFrom(
      this.api.post<void>(API.auth.changePassword, { oldPassword, newPassword })
    ).then(() => {
      const current = this.getSession();
      if (!current) return;
      const updated: SessionUser = { ...current, mustChangePassword: false };
      const token = localStorage.getItem(this.TOKEN_KEY) || '';
      const refreshToken = localStorage.getItem(this.REFRESH_KEY) || '';
      this.persistSession(token, refreshToken, updated);
    });
  }

  forgotPassword(usuario: string): Promise<ForgotPasswordResponse> {
    return firstValueFrom(
      this.api.post<ForgotPasswordResponse>(API.auth.forgotPassword, { usuario })
    );
  }

  resetPassword(usuario: string, code: string, newPassword: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.api.post<{ message: string }>(API.auth.resetPassword, { usuario, code, newPassword })
    );
  }

  private persistSession(token: string, refreshToken: string, user: SessionUser): void {
    const rol = normalizarRol(user.rol);
    const session: SessionUser = { ...user, rol: rol ?? user.rol };

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private loadSession(): SessionUser | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const raw   = localStorage.getItem(this.USER_KEY);
    if (!token || !raw) return null;
    try {
      const parsed = JSON.parse(raw) as SessionUser;
      const rol = normalizarRol(parsed.rol);
      if (!rol) return null;
      return { ...parsed, rol };
    } catch {
      return null;
    }
  }
}
