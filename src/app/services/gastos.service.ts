import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Gasto, GastoEstado, Ministerio, Usuario } from '../core/models';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { estadoGasto, normalizarGasto } from '../shared/utils/gasto.util';
import { fusionarMovimientosTrasBootstrap } from '../shared/utils/movimiento-list-merge.util';
import {
  completarRegistroTrasMutacion,
  fusionarRegistroMovimientoEstado,
  prependRegistroUnico,
  reemplazarRegistroEnLista
} from '../shared/utils/entity-crud.util';
import { withMutationTimeout } from '../shared/utils/http-mutation.util';
import { stampAuditoriaLocal, stampAuditoriaActualizacionLocal } from '../shared/utils/audit.util';
import { AuthService } from '../core/services/auth.service';
import { ROLES } from '../core/constants/roles.constants';

@Injectable({ providedIn: 'root' })
export class GastosService {

  private readonly STORAGE_KEY = 'gastos';
  private gastosSubject = new BehaviorSubject<Gasto[]>([]);
  readonly gastos$: Observable<Gasto[]> = this.gastosSubject.asObservable();

  constructor(
    private notificacionesService: NotificacionesService,
    private api: ApiService,
    private authService: AuthService
  ) {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
    }
  }

  hydrate(lista: Gasto[]): void {
    const normalizados = lista.map(normalizarGasto);
    const merged = fusionarMovimientosTrasBootstrap(normalizados, this.getAll());
    this.gastosSubject.next(merged);
  }

  getAll(): Gasto[] {
    return this.gastosSubject.getValue();
  }

  create(gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Observable<Gasto> {
    if (environment.useLocalFallback) {
      return of(this.createLocal(gasto, fechaFormateada));
    }
    return withMutationTimeout(
      this.api.post<Gasto>(API.gastos.base, { ...gasto, fechaFormateada }).pipe(
        tap(nuevo => {
          const completo = this.completarGastoTrasMutacion(nuevo, gasto, fechaFormateada);
          this.persist(prependRegistroUnico(completo, this.getAll()));
          this.notificacionesService.recargar();
          this.syncListaEnSegundoPlano();
        })
      )
    );
  }

  update(id: number, gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Observable<Gasto> {
    if (environment.useLocalFallback) {
      return of(this.updateLocal(id, gasto, fechaFormateada));
    }
    return withMutationTimeout(
      this.api.put<Gasto>(`${API.gastos.base}/${id}`, { ...gasto, fechaFormateada }).pipe(
        tap(actualizado => {
          const completo = this.completarGastoTrasMutacion(actualizado, gasto, fechaFormateada, id);
          const lista = this.getAll().map(g => (g.id === id ? completo : g));
          this.persist(lista);
          this.notificacionesService.recargar();
        })
      )
    );
  }

  delete(id: number): Observable<void> {
    if (environment.useLocalFallback) {
      this.deleteLocal(id);
      return of(undefined);
    }
    return this.api.delete(`${API.gastos.base}/${id}`).pipe(
      tap(() => {
        this.persist(this.getAll().filter(g => g.id !== id));
        this.notificacionesService.recargar();
      })
    );
  }

  aprobar(id: number): Observable<Gasto> {
    const numId = Number(id);
    if (environment.useLocalFallback) {
      return of(this.aprobarLocal(numId));
    }
    return withMutationTimeout(
      this.api.patch<Gasto>(API.gastos.aprobar(numId), {}).pipe(
        tap(actualizado => {
          const actual = this.getAll().find(g => Number(g.id) === numId);
          const completo = normalizarGasto(
            fusionarRegistroMovimientoEstado(actualizado, actual, numId)
          );
          this.persist(reemplazarRegistroEnLista(this.getAll(), numId, completo));
          this.notificacionesService.recargar();
          this.syncListaEnSegundoPlano();
        })
      )
    );
  }

  rechazar(id: number, motivo?: string): Observable<Gasto> {
    const numId = Number(id);
    if (environment.useLocalFallback) {
      return of(this.rechazarLocal(numId, motivo));
    }
    return withMutationTimeout(
      this.api.patch<Gasto>(API.gastos.rechazar(numId), { motivo }).pipe(
        tap(actualizado => {
          const actual = this.getAll().find(g => Number(g.id) === numId);
          const completo = normalizarGasto(
            fusionarRegistroMovimientoEstado(actualizado, actual, numId)
          );
          this.persist(reemplazarRegistroEnLista(this.getAll(), numId, completo));
          this.notificacionesService.recargar();
          this.syncListaEnSegundoPlano();
        })
      )
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
      ministerio:    ministerio?.nombre ?? gasto.ministerio ?? 'General',
      registradoPor: usuario?.nombre ?? 'Sistema'
    };
  }

  reload(): void {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return;
    }
    void this.reloadAsync().catch(err => console.error('[GastosService] reload:', err));
  }

  reloadAsync(): Promise<Gasto[]> {
    if (environment.useLocalFallback) {
      this.loadFromStorage();
      return Promise.resolve(this.getAll());
    }
    return firstValueFrom(
      this.api.get<Gasto[]>(API.gastos.base).pipe(
        tap(lista => {
          const merged = fusionarMovimientosTrasBootstrap(
            lista.map(normalizarGasto),
            this.getAll()
          );
          this.gastosSubject.next(merged);
        })
      )
    );
  }

  /** Sincroniza la lista completa en segundo plano sin perder filas recién creadas. */
  private syncListaEnSegundoPlano(): void {
    void this.reloadAsync().catch(() => undefined);
  }

  private completarGastoTrasMutacion(
    desdeApi: Gasto,
    enviado: Omit<Gasto, 'id'>,
    fechaFormateada: string,
    idFallback?: number
  ): Gasto {
    const base = completarRegistroTrasMutacion(desdeApi, enviado, idFallback);
    return normalizarGasto({
      ...base,
      fechaFormateada: desdeApi.fechaFormateada ?? fechaFormateada,
      ministerioId: desdeApi.ministerioId ?? enviado.ministerioId,
      usuarioId: desdeApi.usuarioId ?? enviado.usuarioId,
      estado: desdeApi.estado ?? enviado.estado,
      ministerio: desdeApi.ministerio ?? enviado.ministerio,
      registradoPor: desdeApi.registradoPor ?? enviado.registradoPor
    });
  }

  private actorId(): string | undefined {
    const id = this.authService.getSession()?.id;
    return id != null ? String(id) : undefined;
  }

  private createLocal(gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Gasto {
    const audit = stampAuditoriaLocal(this.authService.getSession());
    const nuevo: Gasto = { ...gasto, id: this.nextId(), fechaFormateada, ...audit };
    this.persist([nuevo, ...this.getAll()]);
    this.notifyCreate(nuevo);
    return nuevo;
  }

  private updateLocal(id: number, gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Gasto {
    const current = this.getAll().find(g => g.id === id);
    const estado: GastoEstado =
      current && estadoGasto(current) !== 'aprobado' ? 'pendiente' : (gasto.estado ?? 'pendiente');
    const audit = stampAuditoriaActualizacionLocal(current ?? {}, this.authService.getSession());
    const actualizado: Gasto = {
      ...gasto,
      id,
      fechaFormateada,
      estado: gasto.estado ?? estado,
      motivoRechazo: estado === 'pendiente' ? undefined : gasto.motivoRechazo,
      ...audit
    };
    this.persist(this.getAll().map(g => (g.id === id ? actualizado : g)));
    if (current) {
      this.notifyModificado(actualizado, current);
    }
    return actualizado;
  }

  private aprobarLocal(id: number): Gasto {
    const lista = this.getAll().map(g => {
      if (g.id !== id) return g;
      const audit = stampAuditoriaActualizacionLocal(g, this.authService.getSession());
      return { ...g, estado: 'aprobado' as GastoEstado, motivoRechazo: undefined, ...audit };
    });
    this.persist(lista);
    const updated = lista.find(g => g.id === id)!;
    this.notificarResolucionLiderLocal(updated, 'aprobado');
    return updated;
  }

  private rechazarLocal(id: number, motivo?: string): Gasto {
    const lista = this.getAll().map(g => {
      if (g.id !== id) return g;
      const audit = stampAuditoriaActualizacionLocal(g, this.authService.getSession());
      return {
        ...g,
        estado: 'rechazado' as GastoEstado,
        motivoRechazo: motivo?.trim() || 'Sin motivo indicado',
        ...audit
      };
    });
    this.persist(lista);
    const updated = lista.find(g => g.id === id)!;
    this.notificarResolucionLiderLocal(updated, 'rechazado', motivo);
    return updated;
  }

  private deleteLocal(id: number): void {
    const current = this.getAll().find(g => g.id === id);
    if (current) {
      this.notifyEliminado(current);
    }
    this.persist(this.getAll().filter(g => g.id !== id));
  }

  private notifyModificado(gasto: Gasto, current: Gasto): void {
    const rol = this.authService.getRol();
    const actor = this.actorId();
    const prev = estadoGasto(current);
    const next = estadoGasto(gasto);

    if (rol === ROLES.COLABORADOR) {
      if (prev === 'rechazado' && next === 'pendiente') {
        this.notifyReenvioStaff(gasto);
        return;
      }
      this.notificacionesService.registrar({
        tipo: 'gasto',
        audiencia: 'staff',
        origenRol: ROLES.COLABORADOR,
        actorUserId: actor,
        titulo: 'Gasto actualizado (pendiente de aprobación)',
        mensaje:
          `${gasto.ministerio || 'General'} · ${gasto.descripcion || 'Sin descripción'} · ` +
          `$ ${(gasto.monto || 0).toFixed(2)} — fue modificado y sigue pendiente de revisión.`,
        ruta: '/gastos'
      });
      return;
    }

    if ((rol === ROLES.ADMIN || rol === ROLES.CONTABLE) && gasto.ministerioId != null) {
      this.notificacionesService.registrar({
        tipo: 'gasto',
        audiencia: 'colaborador',
        ministerioId: Number(gasto.ministerioId),
        actorUserId: actor,
        titulo: 'Tu gasto fue modificado',
        mensaje:
          `${gasto.ministerio || 'General'} · ${gasto.descripcion || 'Sin descripción'} · ` +
          `$ ${(gasto.monto || 0).toFixed(2)} — fue modificado por administración o contable.`,
        ruta: '/gastos'
      });
    }
  }

  private notifyEliminado(gasto: Gasto): void {
    const rol = this.authService.getRol();
    const actor = this.actorId();
    const base =
      `${gasto.ministerio || 'General'} · ${gasto.descripcion || 'Sin descripción'} · ` +
      `$ ${(gasto.monto || 0).toFixed(2)}`;

    if (rol === ROLES.COLABORADOR) {
      this.notificacionesService.registrar({
        tipo: 'gasto',
        audiencia: 'staff',
        origenRol: ROLES.COLABORADOR,
        actorUserId: actor,
        titulo: 'Gasto eliminado',
        mensaje: `${base} — fue eliminado por un colaborador del ministerio.`,
        ruta: '/gastos'
      });
      return;
    }

    if ((rol === ROLES.ADMIN || rol === ROLES.CONTABLE) && gasto.ministerioId != null) {
      this.notificacionesService.registrar({
        tipo: 'gasto',
        audiencia: 'colaborador',
        ministerioId: Number(gasto.ministerioId),
        actorUserId: actor,
        titulo: 'Tu gasto fue eliminado',
        mensaje: `${base} — fue eliminado por administración o contable.`,
        ruta: '/gastos'
      });
    }
  }

  private notifyReenvioStaff(gasto: Gasto): void {
    this.notificacionesService.registrar({
      tipo: 'gasto',
      audiencia: 'staff',
      origenRol: ROLES.COLABORADOR,
      actorUserId: this.actorId(),
      titulo: 'Gasto corregido (pendiente de aprobación)',
      mensaje:
        `${gasto.ministerio || 'General'} · ${gasto.descripcion || 'Sin descripción'} · ` +
        `$ ${(gasto.monto || 0).toFixed(2)} — corregido tras rechazo, requiere nueva revisión.`,
      ruta: '/gastos'
    });
  }

  private notifyCreate(nuevo: Gasto): void {
    const rol = this.authService.getRol();
    const actor = this.actorId();
    const base = `${nuevo.ministerio || 'General'} · ${nuevo.descripcion} · $ ${(nuevo.monto || 0).toFixed(2)}`;

    if (rol === ROLES.COLABORADOR && estadoGasto(nuevo) === 'pendiente') {
      this.notificacionesService.registrar({
        tipo: 'gasto',
        audiencia: 'staff',
        origenRol: ROLES.COLABORADOR,
        actorUserId: actor,
        titulo: 'Gasto pendiente de aprobación',
        mensaje: base,
        ruta: '/gastos'
      });
    }
  }

  private notificarResolucionLiderLocal(
    gasto: Gasto,
    estado: 'aprobado' | 'rechazado',
    motivo?: string
  ): void {
    if (gasto.ministerioId == null) return;
    const monto = (gasto.monto || 0).toFixed(2);
    const base = `${gasto.ministerio || 'General'} · ${gasto.descripcion || 'Sin descripción'} · $ ${monto}`;
    const motivoTxt = motivo?.trim() || 'Sin motivo indicado';
    this.notificacionesService.registrar({
      tipo: 'gasto',
      audiencia: 'colaborador',
      ministerioId: Number(gasto.ministerioId),
      actorUserId: this.actorId(),
      titulo: estado === 'aprobado' ? 'Tu gasto fue aprobado' : 'Tu gasto fue rechazado',
      mensaje:
        estado === 'aprobado'
          ? `${base} — fue aprobado.`
          : `${base} — fue rechazado. Motivo: ${motivoTxt}`,
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

