import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notificacion, NotificacionTipo } from '../models/notificacion.model';

export interface NuevaNotificacion {
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  ruta?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {

  private readonly STORAGE_KEY = 'ieca_notificaciones';
  private readonly MAX_ITEMS   = 40;

  private listaSubject = new BehaviorSubject<Notificacion[]>(this.cargar());
  readonly lista$: Observable<Notificacion[]> = this.listaSubject.asObservable();

  registrar(datos: NuevaNotificacion): void {
    const item: Notificacion = {
      id: `${datos.tipo}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tipo: datos.tipo,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      ruta: datos.ruta,
      fecha: new Date().toISOString(),
      leidasPor: []
    };

    const lista = [item, ...this.listaSubject.getValue()].slice(0, this.MAX_ITEMS);
    this.guardar(lista);
  }

  recargar(): void {
    this.listaSubject.next(this.cargar());
  }

  getLista(): Notificacion[] {
    return this.listaSubject.getValue();
  }

  estaLeidaPor(n: Notificacion, usuarioId: string): boolean {
    return (n.leidasPor ?? []).includes(usuarioId);
  }

  getNoLeidasCount(usuarioId: string): number {
    if (!usuarioId) return 0;
    return this.getLista().filter(n => !this.estaLeidaPor(n, usuarioId)).length;
  }

  marcarLeida(id: string, usuarioId: string): void {
    if (!usuarioId) return;
    const lista = this.getLista().map(n => {
      if (n.id !== id) return n;
      const leidas = new Set(n.leidasPor ?? []);
      leidas.add(usuarioId);
      return { ...n, leidasPor: Array.from(leidas) };
    });
    this.guardar(lista);
  }

  marcarTodasLeidas(usuarioId: string): void {
    if (!usuarioId) return;
    const lista = this.getLista().map(n => {
      const leidas = new Set(n.leidasPor ?? []);
      leidas.add(usuarioId);
      return { ...n, leidasPor: Array.from(leidas) };
    });
    this.guardar(lista);
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

  private guardar(lista: Notificacion[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    this.listaSubject.next(lista);
  }

  private cargar(): Notificacion[] {
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
    let leidasPor = n.leidasPor ?? [];
    if (leidasPor.length === 0 && n.leida === true) {
      leidasPor = [];
    }
    return {
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      ruta: n.ruta,
      fecha: n.fecha,
      leidasPor
    };
  }
}
