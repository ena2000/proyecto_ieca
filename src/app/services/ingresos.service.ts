import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Ingreso, IngresoEstado, Ministerio, Usuario } from '../core/models';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { estadoIngreso } from '../shared/utils/ingreso.util';
import { stampAuditoriaLocal, stampAuditoriaActualizacionLocal } from '../shared/utils/audit.util';
import { AuthService } from '../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class IngresosService {

  private readonly STORAGE_KEY = 'ingresos';
  private ingresosSubject = new BehaviorSubject<Ingreso[]>([]);
  readonly ingresos$: Observable<Ingreso[]> = this.ingresosSubject.asObservable();

  constructor(
    private notificacionesService: NotificacionesService,
    private api: ApiService,
    private authService: AuthService
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
    return this.api.post<Ingreso>(API.ingresos.base, { ...ingreso, fechaFormateada }).pipe(
      tap(nuevo => {
        this.persist([nuevo, ...this.getAll()]);
        this.notificacionesService.recargar();
      })
    );
  }

  update(id: number, ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, ingreso, fechaFormateada));
    }
    return this.api.put<Ingreso>(`${API.ingresos.base}/${id}`, { ...ingreso, fechaFormateada }).pipe(
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
    return this.api.delete(`${API.ingresos.base}/${id}`).pipe(
      tap(() => this.persist(this.getAll().filter(i => i.id !== id)))
    );
  }

  aprobar(id: number): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.aprobarLocal(id));
    }
    return this.api.patch<Ingreso>(API.ingresos.aprobar(id), {}).pipe(
      tap(actualizado => {
        this.persist(this.getAll().map(i => (i.id === id ? actualizado : i)));
        this.notificacionesService.recargar();
      })
    );
  }

  rechazar(id: number, motivo?: string): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.rechazarLocal(id, motivo));
    }
    return this.api.patch<Ingreso>(API.ingresos.rechazar(id), { motivo }).pipe(
      tap(actualizado => {
        this.persist(this.getAll().map(i => (i.id === id ? actualizado : i)));
      })
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
    this.api.get<Ingreso[]>(API.ingresos.base).subscribe({
      next: lista => this.ingresosSubject.next(lista),
      error: err => console.error('[IngresosService] reload:', err)
    });
  }

  private createLocal(ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Ingreso {
    const audit = stampAuditoriaLocal(this.authService.getSession());
    const nuevo: Ingreso = { ...ingreso, id: this.nextId(), fechaFormateada, ...audit };
    this.persist([nuevo, ...this.getAll()]);
    this.notifyCreate(nuevo);
    return nuevo;
  }

  private updateLocal(id: number, ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Ingreso {
    const current = this.getAll().find(i => i.id === id);
    const estado: IngresoEstado =
      current && estadoIngreso(current) !== 'aprobado' ? 'pendiente' : (ingreso.estado ?? 'pendiente');
    const audit = stampAuditoriaActualizacionLocal(current ?? {}, this.authService.getSession());
    const actualizado: Ingreso = {
      ...ingreso,
      id,
      fechaFormateada,
      estado: ingreso.estado ?? estado,
      motivoRechazo: estado === 'pendiente' ? undefined : ingreso.motivoRechazo,
      ...audit
    };
    this.persist(this.getAll().map(i => (i.id === id ? actualizado : i)));
    return actualizado;
  }

  private aprobarLocal(id: number): Ingreso {
    const lista = this.getAll().map(i => {
      if (i.id !== id) return i;
      const audit = stampAuditoriaActualizacionLocal(i, this.authService.getSession());
      return { ...i, estado: 'aprobado' as IngresoEstado, motivoRechazo: undefined, ...audit };
    });
    this.persist(lista);
    const updated = lista.find(i => i.id === id)!;
    this.notificacionesService.registrar({
      tipo: 'ingreso',
      titulo: 'Ingreso aprobado',
      mensaje: `${updated.ministerio || 'General'} · ${updated.descripcion} fue aprobado.`,
      ruta: '/ingresos'
    });
    return updated;
  }

  private rechazarLocal(id: number, motivo?: string): Ingreso {
    const lista = this.getAll().map(i => {
      if (i.id !== id) return i;
      const audit = stampAuditoriaActualizacionLocal(i, this.authService.getSession());
      return {
        ...i,
        estado: 'rechazado' as IngresoEstado,
        motivoRechazo: motivo?.trim() || 'Sin motivo indicado',
        ...audit
      };
    });
    this.persist(lista);
    return lista.find(i => i.id === id)!;
  }

  private deleteLocal(id: number): void {
    this.persist(this.getAll().filter(i => i.id !== id));
  }

  private notifyCreate(nuevo: Ingreso): void {
    const pendiente = estadoIngreso(nuevo) === 'pendiente';
    this.notificacionesService.registrar({
      tipo: 'ingreso',
      titulo: pendiente ? 'Ingreso pendiente de aprobación' : 'Nuevo ingreso',
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
