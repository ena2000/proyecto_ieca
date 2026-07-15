import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Ministerio } from '../core/models';
import { formatearISOaDDMMYYYY } from '../shared/utils/date.util';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { ministerioNombreDuplicado, mensajeMinisterioDuplicado } from '../shared/utils/unicidad.util';
import { validarNombreMinisterio } from '../shared/utils/ministerio-nombre.util';
import { withMutationTimeout, API_DELETE_TIMEOUT_MS } from '../shared/utils/http-mutation.util';
import { filtrarMinisteriosCatalogo } from '../shared/constants/ministerios-catalogo.constants';
import { fusionarMovimientosTrasBootstrap } from '../shared/utils/movimiento-list-merge.util';
import {
  completarRegistroTrasMutacion,
  prependRegistroUnico
} from '../shared/utils/entity-crud.util';

@Injectable({ providedIn: 'root' })
export class MinisteriosService {

  private readonly STORAGE_KEY = 'ministerios';
  /** Tombstones en sessionStorage para que un bootstrap viejo no “resucite” tras navegar. */
  private readonly ELIMINADOS_KEY = 'ieca_ministerios_eliminados';
  private ministeriosSubject = new BehaviorSubject<Ministerio[]>([]);
  readonly ministerios$: Observable<Ministerio[]> = this.ministeriosSubject.asObservable();
  /** Evita que bootstrap/merge “revivan” un ministerio recién borrado. */
  private readonly idsEliminados = new Set<number>();

  constructor(private api: ApiService) {
    this.cargarTombstones();
    if (environment.useLocalFallback) {
      this.loadFromStorage();
    }
  }

  hydrate(lista: Ministerio[], opts?: { replace?: boolean }): void {
    const visible = this.sinEliminados(filtrarMinisteriosCatalogo(lista));
    if (opts?.replace) {
      this.ministeriosSubject.next(visible);
      return;
    }
    const merged = this.sinEliminados(
      fusionarMovimientosTrasBootstrap(
        visible,
        this.sinEliminados(this.getAll()),
        this.idsEliminados
      )
    );
    this.ministeriosSubject.next(merged);
  }

  getAll(): Ministerio[] {
    return this.ministeriosSubject.getValue();
  }

  /** Limpia tombstones al cerrar sesión (evita filtrar IDs de otro usuario). */
  clearEliminadosRecientes(): void {
    this.idsEliminados.clear();
    this.guardarTombstones();
  }

  create(ministerio: Omit<Ministerio, 'id' | 'fecha' | 'fechaFormateada'>): Observable<Ministerio> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(ministerio));
    }
    return withMutationTimeout(
      this.api.post<Ministerio>(API.ministerios, ministerio).pipe(
        tap(nuevo => {
          const completo = completarRegistroTrasMutacion(nuevo, ministerio);
          const id = Number(completo.id);
          if (Number.isFinite(id) && id > 0) {
            this.idsEliminados.delete(id);
            this.guardarTombstones();
          }
          this.persist(prependRegistroUnico(completo, this.getAll()));
        })
      )
    );
  }

  update(id: number, ministerio: Ministerio): Observable<Ministerio> {
    const numId = Number(id);
    if (environment.useLocalFallback) {
      return of(this.updateLocal(numId, ministerio));
    }
    return withMutationTimeout(
      this.api.put<Ministerio>(`${API.ministerios}/${numId}`, ministerio).pipe(
        tap(actualizado => {
          const completo = completarRegistroTrasMutacion(actualizado, ministerio, numId);
          this.persist(this.getAll().map(m => (Number(m.id) === numId ? completo : m)));
          this.syncListaEnSegundoPlano();
        })
      )
    );
  }

  delete(id: number): Observable<void> {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      return throwError(() => new Error('Identificador de ministerio inválido.'));
    }
    if (environment.useLocalFallback) {
      this.deleteLocal(numId);
      return of(undefined);
    }

    return withMutationTimeout(
      this.api.delete(`${API.ministerios}/${numId}`).pipe(
        tap(() => {
          this.marcarEliminado(numId);
          this.persist(this.getAll().filter(m => Number(m.id) !== numId));
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
    void this.reloadAsync().catch(err => console.error('[MinisteriosService] reload:', err));
  }

  reloadAsync(): Promise<Ministerio[]> {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return Promise.resolve(this.getAll());
    }
    return firstValueFrom(
      this.api.get<Ministerio[]>(API.ministerios).pipe(
        tap(lista => {
          const merged = this.sinEliminados(
            fusionarMovimientosTrasBootstrap(
              this.sinEliminados(filtrarMinisteriosCatalogo(lista)),
              this.sinEliminados(this.getAll()),
              this.idsEliminados
            )
          );
          this.ministeriosSubject.next(merged);
        })
      )
    );
  }

  private syncListaEnSegundoPlano(): void {
    void this.reloadAsync().catch(() => undefined);
  }

  private marcarEliminado(id: number): void {
    this.idsEliminados.add(id);
    this.guardarTombstones();
  }

  private sinEliminados(lista: Ministerio[]): Ministerio[] {
    if (this.idsEliminados.size === 0) return lista;
    return lista.filter(m => !this.idsEliminados.has(Number(m.id)));
  }

  private cargarTombstones(): void {
    try {
      const raw = sessionStorage.getItem(this.ELIMINADOS_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw) as unknown;
      if (!Array.isArray(ids)) return;
      for (const value of ids) {
        const id = Number(value);
        if (Number.isFinite(id) && id > 0) this.idsEliminados.add(id);
      }
    } catch {
      /* ignore */
    }
  }

  private guardarTombstones(): void {
    try {
      sessionStorage.setItem(this.ELIMINADOS_KEY, JSON.stringify([...this.idsEliminados]));
    } catch {
      /* ignore */
    }
  }

  private createLocal(ministerio: Omit<Ministerio, 'id' | 'fecha' | 'fechaFormateada'>): Ministerio {
    const nombreErr = validarNombreMinisterio(ministerio.nombre);
    if (nombreErr) {
      throw new Error(nombreErr);
    }
    const duplicado = ministerioNombreDuplicado(ministerio.nombre, this.getAll());
    if (duplicado) {
      throw new Error(mensajeMinisterioDuplicado(duplicado));
    }
    const ahora = new Date().toISOString();
    const nuevo: Ministerio = {
      ...ministerio,
      id: this.nextId(),
      fecha: ahora,
      fechaFormateada: formatearISOaDDMMYYYY(ahora)
    };
    this.persist(prependRegistroUnico(nuevo, this.getAll()));
    return nuevo;
  }

  private updateLocal(id: number, ministerio: Ministerio): Ministerio {
    const nombreErr = validarNombreMinisterio(ministerio.nombre);
    if (nombreErr) {
      throw new Error(nombreErr);
    }
    const duplicado = ministerioNombreDuplicado(ministerio.nombre, this.getAll(), id);
    if (duplicado) {
      throw new Error(mensajeMinisterioDuplicado(duplicado));
    }
    const actualizado = { ...ministerio, id };
    this.persist(this.getAll().map(m => (Number(m.id) === Number(id) ? actualizado : m)));
    return actualizado;
  }

  private deleteLocal(id: number): void {
    this.marcarEliminado(Number(id));
    this.persist(this.getAll().filter(m => Number(m.id) !== Number(id)));
  }

  private nextId(): number {
    const ids = this.getAll().map(m => m.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Ministerio[]): void {
    const visible = this.sinEliminados(filtrarMinisteriosCatalogo(lista));
    if (environment.useLocalFallback) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(visible));
    }
    this.ministeriosSubject.next(visible);
  }

  private loadFromStorage(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.ministeriosSubject.next([]);
      return;
    }
    try {
      this.ministeriosSubject.next(this.sinEliminados(JSON.parse(data)));
    } catch {
      this.ministeriosSubject.next([]);
    }
  }
}
