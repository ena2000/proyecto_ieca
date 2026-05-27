import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Ingreso, Ministerio, Usuario } from '../core/models';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IngresosService {

  private readonly STORAGE_KEY = 'ingresos';
  private ingresosSubject = new BehaviorSubject<Ingreso[]>([]);
  readonly ingresos$: Observable<Ingreso[]> = this.ingresosSubject.asObservable();

  constructor(
    private notificacionesService: NotificacionesService,
    private api: ApiService
  ) {
    this.reload();
  }

  getAll(): Ingreso[] {
    return this.ingresosSubject.getValue();
  }

  create(ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(ingreso, fechaFormateada));
    }
    return this.api.post<Ingreso>(API.ingresos, { ...ingreso, fechaFormateada }).pipe(
      tap(nuevo => {
        this.persist([nuevo, ...this.getAll()]);
        this.notifyCreate(nuevo);
      })
    );
  }

  update(id: number, ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, ingreso, fechaFormateada));
    }
    return this.api.put<Ingreso>(`${API.ingresos}/${id}`, { ...ingreso, fechaFormateada }).pipe(
      tap(actualizado => {
        const lista = this.getAll().map(i => (i.id === id ? actualizado : i));
        this.persist(lista);
      })
    );
  }

  delete(id: number): Observable<void> {
    if (environment.useLocalFallback) {
      this.deleteLocal(id);
      return of(undefined);
    }
    return this.api.delete(`${API.ingresos}/${id}`).pipe(
      tap(() => this.persist(this.getAll().filter(i => i.id !== id)))
    );
  }

  resolveRelations(
    ingreso: Ingreso,
    ministerios: Ministerio[],
    usuarios: Usuario[]
  ): Ingreso {
    const ministerio = ministerios.find(m => m.id === ingreso.ministerioId);
    const usuario    = usuarios.find(u => u.id === ingreso.usuarioId);
    return {
      ...ingreso,
      ministerio:    ministerio?.nombre ?? 'General',
      registradoPor: usuario?.nombre ?? 'Sistema'
    };
  }

  reload(): void {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return;
    }
    this.api.get<Ingreso[]>(API.ingresos).subscribe({
      next: lista => this.ingresosSubject.next(lista),
      error: err => console.error('[IngresosService] reload:', err)
    });
  }

  private createLocal(ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Ingreso {
    const nuevo: Ingreso = { ...ingreso, id: this.nextId(), fechaFormateada };
    this.persist([nuevo, ...this.getAll()]);
    this.notifyCreate(nuevo);
    return nuevo;
  }

  private updateLocal(id: number, ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Ingreso {
    const actualizado: Ingreso = { ...ingreso, id, fechaFormateada };
    this.persist(this.getAll().map(i => (i.id === id ? actualizado : i)));
    return actualizado;
  }

  private deleteLocal(id: number): void {
    this.persist(this.getAll().filter(i => i.id !== id));
  }

  private notifyCreate(nuevo: Ingreso): void {
    this.notificacionesService.registrar({
      tipo: 'ingreso',
      titulo: 'Nuevo ingreso',
      mensaje: `${nuevo.ministerio || 'General'} · ${nuevo.descripcion} · $ ${(nuevo.monto || 0).toFixed(2)}`,
      ruta: '/ingresos'
    });
  }

  private nextId(): number {
    const ids = this.getAll().map(i => i.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Ingreso[]): void {
    if (environment.useLocalFallback) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
      } catch {
        throw new Error('STORAGE_QUOTA');
      }
    }
    this.ingresosSubject.next(lista);
  }

  private loadFromStorage(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.ingresosSubject.next([]);
      return;
    }
    try {
      this.ingresosSubject.next(JSON.parse(data));
    } catch {
      this.ingresosSubject.next([]);
    }
  }
}
