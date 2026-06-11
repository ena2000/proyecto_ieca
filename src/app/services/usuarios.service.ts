import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { mensajeUsuarioEmailDuplicado, usuarioEmailDuplicado } from '../shared/utils/unicidad.util';

export type UsuarioPayload = Omit<Usuario, 'id'> & { password?: string };
export type UsuarioCreateResponse = Usuario & { tempPassword?: string };

@Injectable({ providedIn: 'root' })
export class UsuariosService {

  private readonly STORAGE_KEY = 'usuarios';
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  readonly usuarios$: Observable<Usuario[]> = this.usuariosSubject.asObservable();

  constructor(private api: ApiService) {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
    }
  }

  hydrate(lista: Usuario[]): void {
    this.usuariosSubject.next(lista);
  }

  getAll(): Usuario[] {
    return this.usuariosSubject.getValue();
  }

  create(usuario: UsuarioPayload): Observable<UsuarioCreateResponse> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(usuario));
    }
    return this.api.post<UsuarioCreateResponse>(API.usuarios, usuario).pipe(
      tap(res => {
        const { tempPassword: _ignored, ...nuevo } = res;
        this.persist([nuevo as Usuario, ...this.getAll()]);
      })
    );
  }

  update(id: number, usuario: UsuarioPayload): Observable<Usuario> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, usuario));
    }
    return this.api.put<Usuario>(`${API.usuarios}/${id}`, usuario).pipe(
      tap(actualizado => {
        this.persist(this.getAll().map(u => (u.id === id ? actualizado : u)));
      })
    );
  }

  delete(id: number): Observable<void> {
    if (environment.useLocalFallback) {
      this.deleteLocal(id);
      return of(undefined);
    }
    return this.api.delete(`${API.usuarios}/${id}`).pipe(
      tap(() => this.persist(this.getAll().filter(u => u.id !== id)))
    );
  }

  reload(): void {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return;
    }
    this.api.get<Usuario[]>(API.usuarios).subscribe({
      next: lista => this.usuariosSubject.next(lista),
      error: err => console.error('[UsuariosService] reload:', err)
    });
  }

  private createLocal(usuario: UsuarioPayload): Usuario {
    const duplicado = usuarioEmailDuplicado(usuario.email, this.getAll());
    if (duplicado) {
      throw new Error(mensajeUsuarioEmailDuplicado(duplicado));
    }
    const { password: _ignored, ...data } = usuario;
    const nuevo: Usuario = { ...data, id: this.nextId() };
    this.persist([nuevo, ...this.getAll()]);
    return nuevo;
  }

  private updateLocal(id: number, usuario: UsuarioPayload): Usuario {
    const duplicado = usuarioEmailDuplicado(usuario.email, this.getAll(), id);
    if (duplicado) {
      throw new Error(mensajeUsuarioEmailDuplicado(duplicado));
    }
    const { password: _ignored, ...data } = usuario;
    const actualizado: Usuario = { ...data, id };
    this.persist(this.getAll().map(u => (u.id === id ? actualizado : u)));
    return actualizado;
  }

  private deleteLocal(id: number): void {
    this.persist(this.getAll().filter(u => u.id !== id));
  }

  private nextId(): number {
    const ids = this.getAll().map(u => u.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Usuario[]): void {
    if (environment.useLocalFallback) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    }
    this.usuariosSubject.next(lista);
  }

  private loadFromStorage(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.usuariosSubject.next([]);
      return;
    }
    try {
      this.usuariosSubject.next(JSON.parse(data));
    } catch {
      this.usuariosSubject.next([]);
    }
  }
}
