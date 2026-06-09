import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Notificacion,
  NotificacionAudiencia,
  NotificacionTipo
} from '../models/notificacion.model';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { environment } from '../../../environments/environment';
import { AppRole } from '../constants/roles.constants';
import { filtrarNotificacionesParaSesion } from '../../shared/utils/notificacion-filtro.util';

export interface NuevaNotificacion {
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  ruta?: string;
  audiencia?: NotificacionAudiencia;
  ministerioId?: number;
  actorUserId?: string;
  origenRol?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {

  private readonly STORAGE_KEY = 'ieca_notificaciones';
  private readonly MAX_ITEMS   = 40;

  private listaSubject = new BehaviorSubject<Notificacion[]>(
    environment.useLocalFallback ? this.cargarLocal() : []
  );
  readonly lista$: Observable<Notificacion[]> = this.listaSubject.asObservable();

  constructor(private api: ApiService) {}

  registrar(datos: NuevaNotificacion): void {
    if (environment.useLocalFallback) {
      this.registrarLocal(datos);
      return;
    }
    this.api.post<Notificacion>(API.notificaciones.base, datos).subscribe({
      next: item => {
        const lista = [this.normalizar(item), ...this.getLista()].slice(0, this.MAX_ITEMS);
        this.listaSubject.next(lista);
      },
      error: err => console.error('[NotificacionesService] registrar:', err)
    });
  }

  recargar(): void {
    if (environment.useLocalFallback) {
      this.listaSubject.next(this.cargarLocal());
      return;
    }
    this.api.get<Notificacion[]>(API.notificaciones.base).subscribe({
      next: lista => this.hydrate(lista),
      error: err => console.error('[NotificacionesService] recargar:', err)
    });
  }

  hydrate(lista: Notificacion[]): void {
    this.listaSubject.next(lista.map(n => this.normalizar(n)));
  }

  getLista(): Notificacion[] {
    return this.listaSubject.getValue();
  }

  getListaParaSesion(
    rol: AppRole | null | undefined,
    ministerioId?: number | null,
    usuarioId?: string | null
  ): Notificacion[] {
    return filtrarNotificacionesParaSesion(this.getLista(), rol, ministerioId, usuarioId);
  }

  estaLeidaPor(n: Notificacion, usuarioId: string): boolean {
    return (n.leidasPor ?? []).includes(String(usuarioId));
  }

  getNoLeidasCount(
    usuarioId: string,
    rol?: AppRole | null,
    ministerioId?: number | null,
    excluirActor = true
  ): number {
    if (!usuarioId) return 0;
    const lista = rol != null
      ? this.getListaParaSesion(rol, ministerioId, excluirActor ? usuarioId : null)
      : this.getLista();
    return lista.filter(n => !this.estaLeidaPor(n, usuarioId)).length;
  }

  getNoLeidasCountPorTipo(
    usuarioId: string,
    tipo: NotificacionTipo,
    rol?: AppRole | null,
    ministerioId?: number | null
  ): number {
    if (!usuarioId) return 0;
    const lista = rol != null
      ? this.getListaParaSesion(rol, ministerioId, usuarioId)
      : this.getLista();
    return lista.filter(
      n => n.tipo === tipo && !this.estaLeidaPor(n, usuarioId)
    ).length;
  }

  marcarLeidasPorRuta(usuarioId: string, ruta: string): void {
    if (!usuarioId || !ruta) return;
    if (environment.useLocalFallback) {
      this.marcarLeidasPorRutaLocal(usuarioId, ruta);
      return;
    }
    this.api
      .patch<Notificacion[]>(API.notificaciones.marcarPorRuta, { ruta })
      .pipe(tap(lista => this.listaSubject.next(lista.map(n => this.normalizar(n)))))
      .subscribe({ error: err => console.error('[NotificacionesService] marcarLeidasPorRuta:', err) });
  }

  marcarLeidasPorTipo(usuarioId: string, tipo: NotificacionTipo): void {
    if (!usuarioId) return;
    if (environment.useLocalFallback) {
      this.marcarLeidasPorTipoLocal(usuarioId, tipo);
      return;
    }
    this.api
      .patch<Notificacion[]>(API.notificaciones.marcarPorTipo, { tipo })
      .pipe(tap(lista => this.listaSubject.next(lista.map(n => this.normalizar(n)))))
      .subscribe({ error: err => console.error('[NotificacionesService] marcarLeidasPorTipo:', err) });
  }

  marcarLeida(id: string, usuarioId: string): void {
    if (!usuarioId) return;
    if (environment.useLocalFallback) {
      this.marcarLeidaLocal(id, usuarioId);
      return;
    }
    this.api
      .patch<Notificacion>(API.notificaciones.marcarLeida(id), {})
      .pipe(tap(updated => this.reemplazarEnLista(updated)))
      .subscribe({ error: err => console.error('[NotificacionesService] marcarLeida:', err) });
  }

  marcarTodasLeidas(usuarioId: string): void {
    if (!usuarioId) return;
    if (environment.useLocalFallback) {
      this.marcarTodasLeidasLocal(usuarioId);
      return;
    }
    this.api
      .patch<Notificacion[]>(API.notificaciones.marcarTodas, {})
      .pipe(tap(lista => this.listaSubject.next(lista.map(n => this.normalizar(n)))))
      .subscribe({ error: err => console.error('[NotificacionesService] marcarTodasLeidas:', err) });
  }

  tiempoRelativo(fecha: string): string {
    const ahora      = new Date();
    const fechaObj   = new Date(fecha);
    const diferencia = ahora.getTime() - fechaObj.getTime();
    const minutos    = Math.floor(diferencia / 60000);
    const horas      = Math.floor(diferencia / 3600000);
    const dias       = Math.floor(diferencia / 86400000);

    if (minutos < 1)  return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas   < 24) return `Hace ${horas} h`;
    if (dias    === 1) return 'Ayer';
    if (dias    < 7)   return `Hace ${dias} días`;
    return fechaObj.toLocaleDateString('es-GT');
  }

  private reemplazarEnLista(updated: Notificacion): void {
    const item = this.normalizar(updated);
    const lista = this.getLista().map(n => (n.id === item.id ? item : n));
    this.listaSubject.next(lista);
  }

  private registrarLocal(datos: NuevaNotificacion): void {
    const item: Notificacion = {
      id: `${datos.tipo}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tipo: datos.tipo,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      ruta: datos.ruta,
      audiencia: datos.audiencia ?? 'staff',
      origenRol: datos.origenRol,
      ministerioId: datos.ministerioId,
      actorUserId: datos.actorUserId,
      fecha: new Date().toISOString(),
      leidasPor: []
    };
    const lista = [item, ...this.getLista()].slice(0, this.MAX_ITEMS);
    this.guardarLocal(lista);
  }

  private marcarLeidasPorRutaLocal(usuarioId: string, ruta: string): void {
    const lista = this.getLista().map(n => {
      if (n.ruta !== ruta) return n;
      const leidas = new Set((n.leidasPor ?? []).map(String));
      leidas.add(String(usuarioId));
      return { ...n, leidasPor: Array.from(leidas) };
    });
    this.guardarLocal(lista);
  }

  private marcarLeidasPorTipoLocal(usuarioId: string, tipo: NotificacionTipo): void {
    const lista = this.getLista().map(n => {
      if (n.tipo !== tipo) return n;
      const leidas = new Set((n.leidasPor ?? []).map(String));
      leidas.add(String(usuarioId));
      return { ...n, leidasPor: Array.from(leidas) };
    });
    this.guardarLocal(lista);
  }

  private marcarLeidaLocal(id: string, usuarioId: string): void {
    const lista = this.getLista().map(n => {
      if (n.id !== id) return n;
      const leidas = new Set((n.leidasPor ?? []).map(String));
      leidas.add(String(usuarioId));
      return { ...n, leidasPor: Array.from(leidas) };
    });
    this.guardarLocal(lista);
  }

  private marcarTodasLeidasLocal(usuarioId: string): void {
    const lista = this.getLista().map(n => {
      const leidas = new Set((n.leidasPor ?? []).map(String));
      leidas.add(String(usuarioId));
      return { ...n, leidasPor: Array.from(leidas) };
    });
    this.guardarLocal(lista);
  }

  private guardarLocal(lista: Notificacion[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    this.listaSubject.next(lista);
  }

  private cargarLocal(): Notificacion[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Array<Notificacion & { leida?: boolean }>;
      return parsed.map(n => this.normalizar(n));
    } catch {
      return [];
    }
  }

  private normalizar(n: Notificacion & { leida?: boolean }): Notificacion {
    return {
      id: String(n.id),
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      ruta: n.ruta,
      fecha: n.fecha,
      audiencia: n.audiencia ?? 'staff',
      ministerioId: n.ministerioId != null ? Number(n.ministerioId) : undefined,
      actorUserId: n.actorUserId != null ? String(n.actorUserId) : undefined,
      origenRol: n.origenRol != null ? String(n.origenRol) : undefined,
      leidasPor: (n.leidasPor ?? []).map(String)
    };
  }
}
