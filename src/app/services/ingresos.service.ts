import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ingreso, Ministerio, Usuario } from '../core/models';
import { NotificacionesService } from '../core/services/notificaciones.service';

@Injectable({ providedIn: 'root' })
export class IngresosService {

  private readonly STORAGE_KEY = 'ingresos';
  private ingresosSubject = new BehaviorSubject<Ingreso[]>([]);
  readonly ingresos$: Observable<Ingreso[]> = this.ingresosSubject.asObservable();

  constructor(private notificacionesService: NotificacionesService) {
    this.loadFromStorage();
  }

  getAll(): Ingreso[] {
    return this.ingresosSubject.getValue();
  }

  create(ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): Ingreso {
    const nuevo: Ingreso = { ...ingreso, id: this.nextId(), fechaFormateada };
    this.persist([nuevo, ...this.getAll()]);
    this.notificacionesService.registrar({
      tipo: 'ingreso',
      titulo: 'Nuevo ingreso',
      mensaje: `${nuevo.ministerio || 'General'} · ${nuevo.descripcion} · $ ${(nuevo.monto || 0).toFixed(2)}`,
      ruta: '/ingresos'
    });
    return nuevo;
  }

  update(id: number, ingreso: Omit<Ingreso, 'id'>, fechaFormateada: string): void {
    const lista = this.getAll().map(i =>
      i.id === id ? { ...ingreso, id, fechaFormateada } : i
    );
    this.persist(lista);
  }

  delete(id: number): void {
    this.persist(this.getAll().filter(i => i.id !== id));
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
    this.loadFromStorage();
  }

  private nextId(): number {
    const ids = this.getAll().map(i => i.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Ingreso[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
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
