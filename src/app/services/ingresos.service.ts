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
import { ROLES } from '../core/constants/roles.constants';

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
    if (environment.useLocalFallback) {
      this.loadFromStorage();
    }
  }

  hydrate(lista: Ingreso[]): void {
    this.ingresosSubject.next(lista);
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
        this.notificacionesService.recargar();
      })
    );
  }

  delete(id: number): Observable<void> {
    if (environment.useLocalFallback) {
      this.deleteLocal(id);
      return of(undefined);
    }
    return this.api.delete(`${API.ingresos.base}/${id}`).pipe(
      tap(() => {
        this.persist(this.getAll().filter(i => i.id !== id));
        this.notificacionesService.recargar();
      })
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
        this.notificacionesService.recargar();
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

  private actorId(): string | undefined {
    const id = this.authService.getSession()?.id;
    return id != null ? String(id) : undefined;
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
    if (current) {
      this.notifyModificado(actualizado, current);
    }
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
    this.notificarResolucionLiderLocal(updated, 'aprobado');
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
    const updated = lista.find(i => i.id === id)!;
    this.notificarResolucionLiderLocal(updated, 'rechazado', motivo);
    return updated;
  }

  private deleteLocal(id: number): void {
    const current = this.getAll().find(i => i.id === id);
    if (current) {
      this.notifyEliminado(current);
    }
    this.persist(this.getAll().filter(i => i.id !== id));
  }

  private notifyModificado(ingreso: Ingreso, current: Ingreso): void {
    const rol = this.authService.getRol();
    const actor = this.actorId();
    const prev = estadoIngreso(current);
    const next = estadoIngreso(ingreso);

    if (rol === ROLES.LIDER) {
      if (prev === 'rechazado' && next === 'pendiente') {
        this.notifyReenvioStaff(ingreso);
        return;
      }
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'staff',
        origenRol: ROLES.LIDER,
        actorUserId: actor,
        titulo: 'Ingreso actualizado (pendiente de aprobación)',
        mensaje:
          `${ingreso.ministerio || 'General'} · ${ingreso.descripcion || 'Sin descripción'} · ` +
          `$ ${(ingreso.monto || 0).toFixed(2)} — fue modificado y sigue pendiente de revisión.`,
        ruta: '/ingresos'
      });
      return;
    }

    if ((rol === ROLES.ADMIN || rol === ROLES.CONTABLE) && ingreso.ministerioId != null) {
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'lider',
        ministerioId: Number(ingreso.ministerioId),
        actorUserId: actor,
        titulo: 'Tu ingreso fue modificado',
        mensaje:
          `${ingreso.ministerio || 'General'} · ${ingreso.descripcion || 'Sin descripción'} · ` +
          `$ ${(ingreso.monto || 0).toFixed(2)} — fue modificado por administración o contable.`,
        ruta: '/ingresos'
      });
    }
  }

  private notifyEliminado(ingreso: Ingreso): void {
    const rol = this.authService.getRol();
    const actor = this.actorId();
    const base =
      `${ingreso.ministerio || 'General'} · ${ingreso.descripcion || 'Sin descripción'} · ` +
      `$ ${(ingreso.monto || 0).toFixed(2)}`;

    if (rol === ROLES.LIDER) {
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'staff',
        origenRol: ROLES.LIDER,
        actorUserId: actor,
        titulo: 'Ingreso eliminado',
        mensaje: `${base} — fue eliminado por el líder del ministerio.`,
        ruta: '/ingresos'
      });
      return;
    }

    if ((rol === ROLES.ADMIN || rol === ROLES.CONTABLE) && ingreso.ministerioId != null) {
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'lider',
        ministerioId: Number(ingreso.ministerioId),
        actorUserId: actor,
        titulo: 'Tu ingreso fue eliminado',
        mensaje: `${base} — fue eliminado por administración o contable.`,
        ruta: '/ingresos'
      });
    }
  }

  private notifyReenvioStaff(ingreso: Ingreso): void {
    this.notificacionesService.registrar({
      tipo: 'ingreso',
      audiencia: 'staff',
      origenRol: ROLES.LIDER,
      actorUserId: this.actorId(),
      titulo: 'Ingreso corregido (pendiente de aprobación)',
      mensaje:
        `${ingreso.ministerio || 'General'} · ${ingreso.descripcion || 'Sin descripción'} · ` +
        `$ ${(ingreso.monto || 0).toFixed(2)} — corregido tras rechazo, requiere nueva revisión.`,
      ruta: '/ingresos'
    });
  }

  private notifyCreate(nuevo: Ingreso): void {
    if (this.authService.getRol() === ROLES.LIDER && estadoIngreso(nuevo) === 'pendiente') {
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'staff',
        origenRol: ROLES.LIDER,
        actorUserId: this.actorId(),
        titulo: 'Ingreso pendiente de aprobación',
        mensaje: `${nuevo.ministerio || 'General'} · ${nuevo.descripcion} · $ ${(nuevo.monto || 0).toFixed(2)}`,
        ruta: '/ingresos'
      });
    }
  }

  private notificarResolucionLiderLocal(
    ingreso: Ingreso,
    estado: 'aprobado' | 'rechazado',
    motivo?: string
  ): void {
    if (ingreso.ministerioId == null) return;
    const monto = (ingreso.monto || 0).toFixed(2);
    const base = `${ingreso.ministerio || 'General'} · ${ingreso.descripcion || 'Sin descripción'} · $ ${monto}`;
    const motivoTxt = motivo?.trim() || 'Sin motivo indicado';
    this.notificacionesService.registrar({
      tipo: 'ingreso',
      audiencia: 'lider',
      ministerioId: Number(ingreso.ministerioId),
      actorUserId: this.actorId(),
      titulo: estado === 'aprobado' ? 'Tu ingreso fue aprobado' : 'Tu ingreso fue rechazado',
      mensaje:
        estado === 'aprobado'
          ? `${base} — fue aprobado.`
          : `${base} — fue rechazado. Motivo: ${motivoTxt}`,
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
