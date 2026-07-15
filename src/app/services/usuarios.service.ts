import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { mensajeUsuarioEmailDuplicado, usuarioEmailDuplicado } from '../shared/utils/unicidad.util';
import { withMutationTimeout, API_DELETE_TIMEOUT_MS } from '../shared/utils/http-mutation.util';
import { fusionarMovimientosTrasBootstrap } from '../shared/utils/movimiento-list-merge.util';
import {
  completarRegistroTrasMutacion,
  prependRegistroUnico
} from '../shared/utils/entity-crud.util';

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

  hydrate(lista: Usuario[], opts?: { replace?: boolean }): void {
    if (opts?.replace) {
      this.usuariosSubject.next(lista ?? []);
      return;
    }
    const merged = fusionarMovimientosTrasBootstrap(lista, this.getAll());
    this.usuariosSubject.next(merged);
  }

  getAll(): Usuario[] {
    return this.usuariosSubject.getValue();
  }

  create(usuario: UsuarioPayload): Observable<UsuarioCreateResponse> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(usuario));
    }
    return withMutationTimeout(
      this.api.post<UsuarioCreateResponse>(API.usuarios, usuario).pipe(
        tap(res => {
          const { tempPassword: _ignored, ...desdeApi } = res;
          const completo = completarRegistroTrasMutacion(
            desdeApi as Usuario,
            usuario
          ) as Usuario;
          this.persist(prependRegistroUnico(completo, this.getAll()));
        })
      )
    );
  }

  update(id: number, usuario: UsuarioPayload): Observable<Usuario> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, usuario));
    }
    return withMutationTimeout(
      this.api.put<Usuario>(`${API.usuarios}/${id}`, usuario).pipe(
        tap(actualizado => {
          const completo = completarRegistroTrasMutacion(actualizado, usuario, id) as Usuario;
          this.persist(this.getAll().map(u => (Number(u.id) === id ? completo : u)));
          this.syncListaEnSegundoPlano();
        })
      )
    );
  }

  delete(id: number): Observable<void> {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      return new Observable(sub => {
        sub.error(new Error('Identificador de usuario inválido.'));
      });
    }
    if (environment.useLocalFallback) {
      this.deleteLocal(numId);
      return of(undefined);
    }
    return withMutationTimeout(
      this.api.delete(`${API.usuarios}/${numId}`).pipe(
        tap(() => {
          this.persist(this.getAll().filter(u => Number(u.id) !== numId));
        })
      ),
      API_DELETE_TIMEOUT_MS
    );
  }

  reload(): void {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return;
    }
    void this.reloadAsync().catch(err => console.error('[UsuariosService] reload:', err));
  }

  reloadAsync(): Promise<Usuario[]> {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return Promise.resolve(this.getAll());
    }
    return firstValueFrom(
      this.api.get<Usuario[]>(API.usuarios).pipe(
        tap(lista => {
          const merged = fusionarMovimientosTrasBootstrap(lista, this.getAll());
          this.usuariosSubject.next(merged);
        })
      )
    );
  }

  private syncListaEnSegundoPlano(): void {
    void this.reloadAsync().catch(() => undefined);
  }

  private createLocal(usuario: UsuarioPayload): Usuario {
    const duplicado = usuarioEmailDuplicado(usuario.email, this.getAll());
    if (duplicado) {
      throw new Error(mensajeUsuarioEmailDuplicado(duplicado));
    }
    const { password: _ignored, ...data } = usuario;
    const nuevo: Usuario = { ...data, id: this.nextId() };
    this.persist(prependRegistroUnico(nuevo, this.getAll()));
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
    const numId = Number(id);
    this.persist(this.getAll().filter(u => Number(u.id) !== numId));
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
