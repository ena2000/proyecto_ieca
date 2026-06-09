import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Ministerio } from '../core/models';
import { formatearISOaDDMMYYYY } from '../shared/utils/date.util';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';

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
    this.ministeriosSubject.next(lista);
  }

  getAll(): Ministerio[] {
    return this.ministeriosSubject.getValue();
  }

  create(ministerio: Omit<Ministerio, 'id' | 'fecha' | 'fechaFormateada'>): Observable<Ministerio> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(ministerio));
    }
    return this.api.post<Ministerio>(API.ministerios, ministerio).pipe(
      tap(nuevo => this.persist([nuevo, ...this.getAll()]))
    );
  }

  update(id: number, ministerio: Ministerio): Observable<Ministerio> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, ministerio));
    }
    return this.api.put<Ministerio>(`${API.ministerios}/${id}`, ministerio).pipe(
      tap(actualizado => {
        this.persist(this.getAll().map(m => (m.id === id ? actualizado : m)));
      })
    );
  }

  delete(id: number): Observable<void> {
    if (environment.useLocalFallback) {
      this.deleteLocal(id);
      return of(undefined);
    }
    return this.api.delete(`${API.ministerios}/${id}`).pipe(
      tap(() => this.persist(this.getAll().filter(m => m.id !== id)))
    );
  }

  reload(): void {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return;
    }
    this.api.get<Ministerio[]>(API.ministerios).subscribe({
      next: lista => this.ministeriosSubject.next(lista),
      error: err => console.error('[MinisteriosService] reload:', err)
    });
  }

  private createLocal(ministerio: Omit<Ministerio, 'id' | 'fecha' | 'fechaFormateada'>): Ministerio {
    const ahora = new Date().toISOString();
    const nuevo: Ministerio = {
      ...ministerio,
      id: this.nextId(),
      fecha: ahora,
      fechaFormateada: formatearISOaDDMMYYYY(ahora)
    };
    this.persist([nuevo, ...this.getAll()]);
    return nuevo;
  }

  private updateLocal(id: number, ministerio: Ministerio): Ministerio {
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
    if (environment.useLocalFallback) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    }
    this.ministeriosSubject.next(lista);
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
