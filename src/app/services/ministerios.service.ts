import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ministerio } from '../core/models';
import { formatearISOaDDMMYYYY } from '../shared/utils/date.util';

@Injectable({ providedIn: 'root' })
export class MinisteriosService {

  private readonly STORAGE_KEY = 'ministerios';
  private ministeriosSubject = new BehaviorSubject<Ministerio[]>([]);
  readonly ministerios$: Observable<Ministerio[]> = this.ministeriosSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  getAll(): Ministerio[] {
    return this.ministeriosSubject.getValue();
  }

  create(ministerio: Omit<Ministerio, 'id' | 'fecha' | 'fechaFormateada'>): Ministerio {
    const ahora = new Date().toISOString();
    const nuevo: Ministerio = {
      ...ministerio,
      id: this.nextId(),
      fecha: ahora,
      fechaFormateada: formatearISOaDDMMYYYY(ahora)
    };
    this.persist([nuevo, ...this.getAll()]);
    return nuevo;
  }

  update(id: number, ministerio: Ministerio): void {
    const lista = this.getAll().map(m => (m.id === id ? { ...ministerio, id } : m));
    this.persist(lista);
  }

  delete(id: number): void {
    this.persist(this.getAll().filter(m => m.id !== id));
  }

  reload(): void {
    this.loadFromStorage();
  }

  private nextId(): number {
    const ids = this.getAll().map(m => m.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Ministerio[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    this.ministeriosSubject.next(lista);
  }

  private loadFromStorage(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.ministeriosSubject.next([]);
      return;
    }
    try {
      this.ministeriosSubject.next(JSON.parse(data));
    } catch {
      this.ministeriosSubject.next([]);
    }
  }
}
