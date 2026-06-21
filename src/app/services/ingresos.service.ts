import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Ingreso, IngresoEstado, Ministerio, Usuario } from '../core/models';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { estadoIngreso, normalizarIngreso } from '../shared/utils/ingreso.util';
import { stampAuditoriaLocal, stampAuditoriaActualizacionLocal } from '../shared/utils/audit.util';
import { AuthService } from '../core/services/auth.service';
import { ROLES } from '../core/constants/roles.constants';
import { formatearISOaDDMMYYYY } from '../shared/utils/date.util';
import { withMutationTimeout } from '../shared/utils/http-mutation.util';
import {
  crearIngresoIglesiaPorAportacion,
  ingresoEstaAprobadoParaAportacion,
  ingresoRequiereAportacion,
  marcarIngresoConAportacion,
  assertMovimientoAportacionModificable
} from '../shared/utils/aportacion-iglesia.util';

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
    this.ingresosSubject.next(lista.map(normalizarIngreso));
  }

  getAll(): Ingreso[] {
    return this.ingresosSubject.getValue();
  }

  create(ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(ingreso, fechaFormateada));
    }
    const payload = this.buildApiPayload(ingreso, fechaFormateada);
    return withMutationTimeout(
      this.api.post<Ingreso>(API.ingresos.base, payload)
    ).pipe(
      tap(nuevo => {
        this.persist([nuevo, ...this.getAll()]);
        this.notificacionesService.recargar();
        this.syncListaEnSegundoPlano();
      })
    );
  }

  update(id: number, ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, ingreso, fechaFormateada));
    }
    return withMutationTimeout(
      this.api.put<Ingreso>(`${API.ingresos.base}/${id}`, this.buildApiPayload(ingreso, fechaFormateada))
    ).pipe(
      tap(actualizado => {
        const lista = this.getAll().map(i => (i.id === id ? actualizado : i));
        this.persist(lista);
        this.notificacionesService.recargar();
        this.syncListaEnSegundoPlano();
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
        this.syncListaEnSegundoPlano();
      })
    );
  }

  aprobar(id: number): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.aprobarLocal(id));
    }
    return withMutationTimeout(
      this.api.patch<Ingreso>(API.ingresos.aprobar(id), {})
    ).pipe(
      tap(actualizado => {
        this.persist(this.getAll().map(i => (i.id === id ? actualizado : i)));
        this.notificacionesService.recargar();
        this.syncListaEnSegundoPlano();
      })
    );
  }

  rechazar(id: number, motivo?: string): Observable<Ingreso> {
    if (environment.useLocalFallback) {
      return of(this.rechazarLocal(id, motivo));
    }
    return withMutationTimeout(
      this.api.patch<Ingreso>(API.ingresos.rechazar(id), { motivo })
    ).pipe(
      tap(actualizado => {
        this.persist(this.getAll().map(i => (i.id === id ? actualizado : i)));
        this.notificacionesService.recargar();
        this.syncListaEnSegundoPlano();
      })
    );
  }

  resolveRelations(
    ingreso: Ingreso,
    ministerios: Ministerio[],
    usuarios: Usuario[]
  ): Ingreso {
    const ministerioId = ingreso.ministerioId != null ? Number(ingreso.ministerioId) : undefined;
    const usuarioId    = ingreso.usuarioId != null ? Number(ingreso.usuarioId) : undefined;
    const ministerio   = ministerioId != null
      ? ministerios.find(m => Number(m.id) === ministerioId)
      : undefined;
    const usuario      = usuarioId != null
      ? usuarios.find(u => Number(u.id) === usuarioId)
      : undefined;
    return {
      ...ingreso,
      ministerioId,
      usuarioId,
      ministerio:    ministerio?.nombre ?? ingreso.ministerio ?? 'General',
      registradoPor: usuario?.nombre ?? 'Sistema'
    };
  }

  reload(): void {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return;
    }
    void this.reloadAsync().catch(err => console.error('[IngresosService] reload:', err));
  }

  reloadAsync(): Promise<Ingreso[]> {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return Promise.resolve(this.getAll());
    }
    return firstValueFrom(
      this.api.get<Ingreso[]>(API.ingresos.base).pipe(
        tap(lista => this.ingresosSubject.next(lista))
      )
    );
  }

  /** Sincroniza la lista completa en segundo plano (p. ej. aportación 33% tras aprobar). */
  private syncListaEnSegundoPlano(): void {
    void this.reloadAsync().catch(() => undefined);
  }

  private actorId(): string | undefined {
    const id = this.authService.getSession()?.id;
    return id != null ? String(id) : undefined;
  }

  /** Payload limpio para la API (sin id ni campos internos de aportación). */
  private buildApiPayload(ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Record<string, unknown> {
    const {
      id: _id,
      estado: _estado,
      esAportacionIglesia: _ei,
      ingresoOrigenId: _io,
      aportacionGenerada: _ag,
      montoNetoMinisterio: _mn,
      montoAportacionIglesia: _ma,
      ingresoIglesiaId: _ii,
      gastoAportacionId: _ga,
      cerrado: _c,
      periodoCierre: _pc,
      ...rest
    } = ingreso as Ingreso;

    return {
      ...rest,
      monto: Number(ingreso.monto),
      ministerioId: ingreso.ministerioId != null ? Number(ingreso.ministerioId) : undefined,
      usuarioId: ingreso.usuarioId != null ? Number(ingreso.usuarioId) : undefined,
      fechaFormateada,
      foto: ingreso.foto ?? '',
      categoria: ingreso.categoria?.trim() || ingreso.cuentaNombre?.trim() || ''
    };
  }

  private createLocal(ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Ingreso {
    const audit = stampAuditoriaLocal(this.authService.getSession());
    const nuevo: Ingreso = { ...ingreso, id: this.nextId(), fechaFormateada, ...audit };
    this.persist([nuevo, ...this.getAll()]);
    this.notifyCreate(nuevo);
    return this.aplicarAportacionIglesiaLocal(nuevo);
  }

  private updateLocal(id: number, ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Ingreso {
    const current = this.getAll().find(i => i.id === id);
    assertMovimientoAportacionModificable(current);
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
    return this.aplicarAportacionIglesiaLocal(updated);
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
      assertMovimientoAportacionModificable(current);
      this.revertirAportacionIglesiaLocal(current);
      this.notifyEliminado(current);
    }
    this.persist(this.getAll().filter(i => i.id !== id));
  }

  private notifyModificado(ingreso: Ingreso, current: Ingreso): void {
    const rol = this.authService.getRol();
    const actor = this.actorId();
    const prev = estadoIngreso(current);
    const next = estadoIngreso(ingreso);

    if (rol === ROLES.COLABORADOR) {
      if (prev === 'rechazado' && next === 'pendiente') {
        this.notifyReenvioStaff(ingreso);
        return;
      }
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'staff',
        origenRol: ROLES.COLABORADOR,
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
        audiencia: 'colaborador',
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

    if (rol === ROLES.COLABORADOR) {
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'staff',
        origenRol: ROLES.COLABORADOR,
        actorUserId: actor,
        titulo: 'Ingreso eliminado',
        mensaje: `${base} — fue eliminado por un colaborador del ministerio.`,
        ruta: '/ingresos'
      });
      return;
    }

    if ((rol === ROLES.ADMIN || rol === ROLES.CONTABLE) && ingreso.ministerioId != null) {
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'colaborador',
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
      origenRol: ROLES.COLABORADOR,
      actorUserId: this.actorId(),
      titulo: 'Ingreso corregido (pendiente de aprobación)',
      mensaje:
        `${ingreso.ministerio || 'General'} · ${ingreso.descripcion || 'Sin descripción'} · ` +
        `$ ${(ingreso.monto || 0).toFixed(2)} — corregido tras rechazo, requiere nueva revisión.`,
      ruta: '/ingresos'
    });
  }

  private notifyCreate(nuevo: Ingreso): void {
    if (this.authService.getRol() === ROLES.COLABORADOR && estadoIngreso(nuevo) === 'pendiente') {
      this.notificacionesService.registrar({
        tipo: 'ingreso',
        audiencia: 'staff',
        origenRol: ROLES.COLABORADOR,
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
      audiencia: 'colaborador',
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

  private aplicarAportacionIglesiaLocal(ingreso: Ingreso): Ingreso {
    if (!ingresoRequiereAportacion(ingreso) || !ingresoEstaAprobadoParaAportacion(ingreso)) {
      return ingreso;
    }

    const fechaFormateada = ingreso.fechaFormateada || formatearISOaDDMMYYYY(ingreso.fecha);
    const ingresoIglesia = crearIngresoIglesiaPorAportacion(
      ingreso,
      this.nextId(),
      fechaFormateada
    );

    this.persist([ingresoIglesia, ...this.getAll()]);

    const marcado = marcarIngresoConAportacion(ingreso, ingresoIglesia.id);
    this.persist(this.getAll().map(i => (i.id === ingreso.id ? marcado : i)));
    return marcado;
  }

  private revertirAportacionIglesiaLocal(ingreso: Ingreso): void {
    if (ingreso.ingresoIglesiaId != null) {
      this.persist(this.getAll().filter(i => i.id !== ingreso.ingresoIglesiaId));
    }
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
      const parsed = JSON.parse(data) as Ingreso[];
      this.ingresosSubject.next(parsed.map(normalizarIngreso));
    } catch {
      this.ingresosSubject.next([]);
    }
  }
}
