import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
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
  private ministeriosSubject = new BehaviorSubject<Ministerio[]>([]);
  readonly ministerios$: Observable<Ministerio[]> = this.ministeriosSubject.asObservable();

  constructor(private api: ApiService) {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
    }
  }

  hydrate(lista: Ministerio[]): void {
    const visible = filtrarMinisteriosCatalogo(lista);
    const merged = fusionarMovimientosTrasBootstrap(visible, this.getAll());
    this.ministeriosSubject.next(merged);
  }

  getAll(): Ministerio[] {
    return this.ministeriosSubject.getValue();
  }

  create(ministerio: Omit<Ministerio, 'id' | 'fecha' | 'fechaFormateada'>): Observable<Ministerio> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(ministerio));
    }
    return withMutationTimeout(
      this.api.post<Ministerio>(API.ministerios, ministerio).pipe(
        tap(nuevo => {
          const completo = completarRegistroTrasMutacion(nuevo, ministerio);
          this.persist(prependRegistroUnico(completo, this.getAll()));
        })
      )
    );
  }

  update(id: number, ministerio: Ministerio): Observable<Ministerio> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, ministerio));
    }
    return withMutationTimeout(
      this.api.put<Ministerio>(`${API.ministerios}/${id}`, ministerio).pipe(
        tap(actualizado => {
          const completo = completarRegistroTrasMutacion(actualizado, ministerio, id);
          this.persist(this.getAll().map(m => (Number(m.id) === id ? completo : m)));
          this.syncListaEnSegundoPlano();
        })
      )
    );
  }

  delete(id: number): Observable<void> {
    if (environment.useLocalFallback) {
      this.deleteLocal(id);
      return of(undefined);
    }
    return withMutationTimeout(
      this.api.delete(`${API.ministerios}/${id}`).pipe(
        tap(() => {
          this.persist(this.getAll().filter(m => Number(m.id) !== id));
          this.syncListaEnSegundoPlano();
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
          const merged = fusionarMovimientosTrasBootstrap(
            filtrarMinisteriosCatalogo(lista),
            this.getAll()
          );
          this.ministeriosSubject.next(merged);
        })
      )
    );
  }

  private syncListaEnSegundoPlano(): void {
    void this.reloadAsync().catch(() => undefined);
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
    this.persist(this.getAll().map(m => (m.id === id ? actualizado : m)));
    return actualizado;
  }

  private deleteLocal(id: number): void {
    this.persist(this.getAll().filter(m => m.id !== id));
  }

  private nextId(): number {
    const ids = this.getAll().map(m => m.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Ministerio[]): void {
    const visible = filtrarMinisteriosCatalogo(lista);
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
      this.ministeriosSubject.next(JSON.parse(data));
    } catch {
      this.ministeriosSubject.next([]);
    }
  }
}
