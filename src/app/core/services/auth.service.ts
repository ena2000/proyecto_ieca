import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SessionUser } from '../models';
import {
  AppRole,
  ROLES,
  normalizarRol,
  puedeAccederRuta,
  rutaPorDefecto
} from '../constants/roles.constants';

interface LoginResult {
  success: boolean;
  mensaje?: string;
}

interface HardcodedUser {
  usuario: string;
  password: string;
  id: string;
  rol: AppRole;
  email: string;
  ministerioId?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY  = 'user_data';

  private readonly HARDCODED_USERS: HardcodedUser[] = [
    {
      usuario: 'admin',
      password: '123456',
      id: '1',
      rol: ROLES.ADMIN,
      email: 'admin@ieca.com'
    },
    {
      usuario: 'contable',
      password: '123456',
      id: '2',
      rol: ROLES.CONTABLE,
      email: 'contable@ieca.com'
    },
    {
      usuario: 'lider',
      password: '123456',
      id: '3',
      rol: ROLES.LIDER,
      email: 'lider@ieca.com',
      ministerioId: 1
    }
  ];

  private sessionSubject = new BehaviorSubject<SessionUser | null>(this.loadSession());
  readonly session$: Observable<SessionUser | null> = this.sessionSubject.asObservable();

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

  /** Contable: ingresos y gastos sin crear/editar/eliminar. */
  isSoloLecturaFinanzas(): boolean {
    return this.isContable();
  }

  /** Líder/Co-Líder: datos limitados a su ministerio. */
  getMinisterioScopeId(): number | null {
    const id = this.getSession()?.ministerioId;
    return this.isLider() && id != null ? Number(id) : null;
  }

  puedeAccederRuta(ruta: string): boolean {
    return puedeAccederRuta(this.getRol(), ruta);
  }

  getRutaPorDefecto(): string {
    return rutaPorDefecto(this.getRol());
  }

  login(usuario: string, password: string): Promise<LoginResult> {
    return new Promise(resolve => {
      setTimeout(() => {
        const found = this.HARDCODED_USERS.find(
          u => u.usuario === usuario && u.password === password
        );

        if (!found) {
          resolve({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
          return;
        }

        const session: SessionUser = {
          id: found.id,
          usuario: found.usuario,
          email: found.email,
          rol: found.rol,
          ministerioId: found.ministerioId
        };

        localStorage.setItem(this.TOKEN_KEY, `token_${found.id}_${Date.now()}`);
        localStorage.setItem(this.USER_KEY, JSON.stringify(session));
        this.sessionSubject.next(session);

        resolve({ success: true });
      }, 800);
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.sessionSubject.next(null);
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
