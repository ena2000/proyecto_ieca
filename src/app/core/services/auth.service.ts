import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of, timeout, TimeoutError, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';
import { isJwtExpired } from '../../shared/utils/jwt.util';
import { SessionUser, LoginResponse, RefreshTokenResponse } from '../models';
import {
  AppRole,
  ROLES,
  esColaboradorMinisterio,
  normalizarRol,
  puedeAccederRuta,
  rutaPorDefecto
} from '../constants/roles.constants';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { environment } from '../../../environments/environment';
import { loginLocalFallback } from './auth-local.fallback';
import {
  AUTH_REFRESH_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  authStorageClearSession,
  authStorageGet,
  authStorageSet
} from '../../shared/utils/auth-token.storage';

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

const AUTH_REQUEST_TIMEOUT_MS = 35_000;
const RESET_PASSWORD_TIMEOUT_MS = 60_000;
const AUTH_TIMEOUT_MESSAGE =
  'La operación tardó demasiado. Espera un momento e inténtalo de nuevo.';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = AUTH_TOKEN_KEY;
  private readonly REFRESH_KEY = AUTH_REFRESH_KEY;
  private readonly USER_KEY = AUTH_USER_KEY;

  private refreshInFlight: Promise<boolean> | null = null;

  private sessionSubject = new BehaviorSubject<SessionUser | null>(this.loadSession());
  readonly session$: Observable<SessionUser | null> = this.sessionSubject.asObservable();

  constructor(private api: ApiService) {
    this.purgeStaleSession();
  }

  isAuthenticated(): boolean {
    this.purgeStaleSession();
    return !!authStorageGet(this.TOKEN_KEY) && !!this.sessionSubject.getValue();
  }

  /** Elimina tokens caducados o ilegibles (p. ej. tras redeploy con otro JWT_SECRET). */
  purgeStaleSession(): void {
    const access = authStorageGet(this.TOKEN_KEY);
    const refresh = authStorageGet(this.REFRESH_KEY);
    if (!access && !refresh) {
      if (this.sessionSubject.getValue()) {
        this.clearSessionStorage();
      }
      return;
    }
    const accessDead = isJwtExpired(access);
    const refreshDead = isJwtExpired(refresh);
    if (accessDead && refreshDead) {
      this.clearSessionStorage();
    }
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

  isColaborador(): boolean {
    return esColaboradorMinisterio(this.getRol());
  }

  /** @deprecated Use isColaborador */
  isLider(): boolean {
    return this.isColaborador();
  }

  isSoloLecturaFinanzas(): boolean {
    return this.isContable();
  }

  getMinisterioScopeId(): number | null {
    const id = this.getSession()?.ministerioId;
    return this.isColaborador() && id != null ? Number(id) : null;
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
        this.withAuthTimeout(),
        tap(res => this.persistSession(res.token, res.refreshToken, res.user)),
        map(() => ({ success: true } as LoginResult)),
        catchError(err => of({
          success: false,
          mensaje: this.mensajeErrorAuth(err, 'Usuario o contraseña incorrectos')
        } as LoginResult))
      )
    );
  }

  logout(): void {
    if (!environment.useLocalFallback) {
      const refreshToken = authStorageGet(this.REFRESH_KEY);
      this.api
        .post(API.auth.logout, refreshToken ? { refreshToken } : {})
        .subscribe({ error: () => undefined });
    }
    this.clearSessionStorage();
  }

  /** Renueva el access token usando el refresh token almacenado. */
  refreshAccessToken(): Promise<boolean> {
    if (environment.useLocalFallback) {
      return Promise.resolve(!!authStorageGet(this.TOKEN_KEY));
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = authStorageGet(this.REFRESH_KEY);
    if (!refreshToken) {
      return Promise.resolve(false);
    }

    this.refreshInFlight = firstValueFrom(
      this.api.post<RefreshTokenResponse>(API.auth.refresh, { refreshToken }).pipe(
        tap(res => {
          if (res.user) {
            this.persistSession(res.token, res.refreshToken, res.user);
            return;
          }
          authStorageSet(this.TOKEN_KEY, res.token);
          authStorageSet(this.REFRESH_KEY, res.refreshToken);
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
      this.api.post<{ token: string; refreshToken: string; user: SessionUser }>(
        API.auth.changePassword,
        { oldPassword, newPassword }
      ).pipe(this.withAuthTimeout())
    ).then((res) => {
      if (res?.token && res?.refreshToken && res?.user) {
        this.persistSession(res.token, res.refreshToken, res.user);
        return;
      }
      const current = this.getSession();
      if (!current) return;
      const updated: SessionUser = { ...current, mustChangePassword: false };
      const token = authStorageGet(this.TOKEN_KEY) || '';
      const refreshToken = authStorageGet(this.REFRESH_KEY) || '';
      this.persistSession(token, refreshToken, updated);
    });
  }

  forgotPassword(usuario: string): Promise<ForgotPasswordResponse> {
    return firstValueFrom(
      this.api.post<ForgotPasswordResponse>(API.auth.forgotPassword, { usuario }).pipe(
        this.withAuthTimeout()
      )
    );
  }

  resetPassword(usuario: string, code: string, newPassword: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.api.post<{ message: string }>(API.auth.resetPassword, { usuario, code, newPassword }).pipe(
        this.withAuthTimeout(RESET_PASSWORD_TIMEOUT_MS)
      )
    );
  }

  private withAuthTimeout<T>(ms = AUTH_REQUEST_TIMEOUT_MS) {
    return (source: Observable<T>) =>
      source.pipe(
        timeout(ms),
        catchError(err => {
          if (err instanceof TimeoutError) {
            return throwError(() => new Error(AUTH_TIMEOUT_MESSAGE));
          }
          return throwError(() => err);
        })
      );
  }

  private mensajeErrorAuth(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) {
      return AUTH_TIMEOUT_MESSAGE;
    }
    const fromHttp = getHttpErrorMessage(error, '');
    if (fromHttp) {
      return fromHttp;
    }
    if (error instanceof Error && error.message?.trim()) {
      return error.message;
    }
    return fallback;
  }

  private clearSessionStorage(): void {
    authStorageClearSession();
    this.sessionSubject.next(null);
  }

  private persistSession(token: string, refreshToken: string, user: SessionUser): void {
    const rol = normalizarRol(user.rol);
    const session: SessionUser = { ...user, rol: rol ?? user.rol };

    authStorageSet(this.TOKEN_KEY, token);
    authStorageSet(this.REFRESH_KEY, refreshToken);
    authStorageSet(this.USER_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private loadSession(): SessionUser | null {
    const token = authStorageGet(this.TOKEN_KEY);
    const raw = authStorageGet(this.USER_KEY);
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
