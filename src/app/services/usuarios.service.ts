import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../core/models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {

  private readonly STORAGE_KEY = 'usuarios';
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  readonly usuarios$: Observable<Usuario[]> = this.usuariosSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  getAll(): Usuario[] {
    return this.usuariosSubject.getValue();
  }

  create(usuario: Omit<Usuario, 'id'>): Usuario {
    const nuevo: Usuario = { ...usuario, id: this.nextId() };
    this.persist([nuevo, ...this.getAll()]);
    return nuevo;
  }

  update(id: number, usuario: Omit<Usuario, 'id'>): void {
    const lista = this.getAll().map(u => (u.id === id ? { ...usuario, id } : u));
    this.persist(lista);
  }

  delete(id: number): void {
    this.persist(this.getAll().filter(u => u.id !== id));
  }

  reload(): void {
    this.loadFromStorage();
  }

  private nextId(): number {
    const ids = this.getAll().map(u => u.id || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private persist(lista: Usuario[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    this.usuariosSubject.next(lista);
  }

  private loadFromStorage(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.usuariosSubject.next([]);
      return;
    }
    try {
      this.usuariosSubject.next(JSON.parse(data));
    } catch {
      this.usuariosSubject.next([]);
    }
  }
}
