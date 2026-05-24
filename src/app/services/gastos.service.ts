import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Gasto, Ministerio, Usuario } from '../core/models';
import { NotificacionesService } from '../core/services/notificaciones.service';

@Injectable({ providedIn: 'root' })
export class GastosService {

  private readonly STORAGE_KEY = 'gastos';
  private gastosSubject = new BehaviorSubject<Gasto[]>([]);
  readonly gastos$: Observable<Gasto[]> = this.gastosSubject.asObservable();

  constructor(private notificacionesService: NotificacionesService) {
    this.loadFromStorage();
  }

  getAll(): Gasto[] {
    return this.gastosSubject.getValue();
  }

  create(gasto: Omit<Gasto, 'id'>, fechaFormateada: string): Gasto {
    const nuevo: Gasto = { ...gasto, id: this.nextId(), fechaFormateada };
    this.persist([nuevo, ...this.getAll()]);
    this.notificacionesService.registrar({
      tipo: 'gasto',
      titulo: 'Nuevo gasto',
      mensaje: `${nuevo.ministerio || 'General'} · ${nuevo.descripcion} · $ ${(nuevo.monto || 0).toFixed(2)}`,
      ruta: '/gastos'
    });
    return nuevo;
  }

  update(id: number, gasto: Omit<Gasto, 'id'>, fechaFormateada: string): void {
    const lista = this.getAll().map(g =>
      g.id === id ? { ...gasto, id, fechaFormateada } : g
    );
    this.persist(lista);
  }

  delete(id: number): void {
    this.persist(this.getAll().filter(g => g.id !== id));
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
    this.loadFromStorage();
  }

  private nextId(): number {
    const ids = this.getAll().map(g => g.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Gasto[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    } catch {
      throw new Error('STORAGE_QUOTA');
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
