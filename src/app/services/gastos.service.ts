import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Gasto, Ministerio, Usuario } from '../core/models';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GastosService {

  private readonly STORAGE_KEY = 'gastos';
  private gastosSubject = new BehaviorSubject<Gasto[]>([]);
  readonly gastos$: Observable<Gasto[]> = this.gastosSubject.asObservable();

  constructor(
    private notificacionesService: NotificacionesService,
    private api: ApiService
  ) {
    this.reload();
  }

  getAll(): Gasto[] {
    return this.gastosSubject.getValue();
  }

  create(gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Observable<Gasto> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(gasto, fechaFormateada));
    }
    return this.api.post<Gasto>(API.gastos, { ...gasto, fechaFormateada }).pipe(
      tap(nuevo => {
        this.persist([nuevo, ...this.getAll()]);
        this.notifyCreate(nuevo);
      })
    );
  }

  update(id: number, gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Observable<Gasto> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, gasto, fechaFormateada));
    }
    return this.api.put<Gasto>(`${API.gastos}/${id}`, { ...gasto, fechaFormateada }).pipe(
      tap(actualizado => {
        const lista = this.getAll().map(g => (g.id === id ? actualizado : g));
        this.persist(lista);
      })
    );
  }

  delete(id: number): Observable<void> {
    if (environment.useLocalFallback) {
      this.deleteLocal(id);
      return of(undefined);
    }
    return this.api.delete(`${API.gastos}/${id}`).pipe(
      tap(() => this.persist(this.getAll().filter(g => g.id !== id)))
    );
  }

  resolveRelations(
    gasto: Gasto,
    ministerios: Ministerio[],
    usuarios: Usuario[]
  ): Gasto {
    const ministerioId = gasto.ministerioId != null ? Number(gasto.ministerioId) : undefined;
    const usuarioId    = gasto.usuarioId != null ? Number(gasto.usuarioId) : undefined;
    const ministerio   = ministerios.find(m => Number(m.id) === ministerioId);
    const usuario      = usuarios.find(u => Number(u.id) === usuarioId);
    return {
      ...gasto,
      ministerioId,
      usuarioId,
      ministerio:    ministerio?.nombre ?? 'General',
      registradoPor: usuario?.nombre ?? 'Sistema'
    };
  }

  reload(): void {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return;
    }
    this.api.get<Gasto[]>(API.gastos).subscribe({
      next: lista => this.gastosSubject.next(lista),
      error: err => console.error('[GastosService] reload:', err)
    });
  }

  private createLocal(gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Gasto {
    const nuevo: Gasto = { ...gasto, id: this.nextId(), fechaFormateada };
    this.persist([nuevo, ...this.getAll()]);
    this.notifyCreate(nuevo);
    return nuevo;
  }

  private updateLocal(id: number, gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Gasto {
    const actualizado: Gasto = { ...gasto, id, fechaFormateada };
    this.persist(this.getAll().map(g => (g.id === id ? actualizado : g)));
    return actualizado;
  }

  private deleteLocal(id: number): void {
    this.persist(this.getAll().filter(g => g.id !== id));
  }

  private notifyCreate(nuevo: Gasto): void {
    this.notificacionesService.registrar({
      tipo: 'gasto',
      titulo: 'Nuevo gasto',
      mensaje: `${nuevo.ministerio || 'General'} · ${nuevo.descripcion} · $ ${(nuevo.monto || 0).toFixed(2)}`,
      ruta: '/gastos'
    });
  }

  private nextId(): number {
    const ids = this.getAll().map(g => g.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Gasto[]): void {
    if (environment.useLocalFallback) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
      } catch {
        throw new Error('STORAGE_QUOTA');
      }
    }
    this.gastosSubject.next(lista);
  }

  private loadFromStorage(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.gastosSubject.next([]);
      return;
    }
    try {
      this.gastosSubject.next(JSON.parse(data));
    } catch {
      this.gastosSubject.next([]);
    }
  }
}
