import {
  completarRegistroTrasMutacion,
  fusionarRegistroMovimientoEstado,
  prependRegistroUnico
} from './entity-crud.util';
import { fusionarMovimientosTrasBootstrap } from './movimiento-list-merge.util';

describe('entity-crud.util', () => {
  it('completarRegistroTrasMutacion fusiona enviado y API', () => {
    type Row = { id?: number; nombre: string; estado?: string };
    const r = completarRegistroTrasMutacion<Row>(
      { id: 2, nombre: 'API' },
      { nombre: 'Form', estado: 'Activo' },
      99
    );
    expect(r).toEqual({ id: 2, nombre: 'API', estado: 'Activo' });
  });

  it('prependRegistroUnico evita duplicados por id', () => {
    const lista = prependRegistroUnico(
      { id: 1, nombre: 'Nuevo' },
      [{ id: 1, nombre: 'Viejo' }, { id: 2, nombre: 'Otro' }]
    );
    expect(lista).toEqual([
      { id: 1, nombre: 'Nuevo' },
      { id: 2, nombre: 'Otro' }
    ]);
  });

  it('fusionarRegistroMovimientoEstado conserva aprobado local frente a pendiente del servidor', () => {
    const r = fusionarRegistroMovimientoEstado(
      { id: 1, estado: 'pendiente', monto: 10 },
      { id: 1, estado: 'aprobado', monto: 10, descripcion: 'Local' },
      1
    );
    expect(r.estado).toBe('aprobado');
    expect(r.descripcion).toBe('Local');
  });
});

describe('movimiento-list-merge.util', () => {
  it('prioriza estado local más avanzado al fusionar con bootstrap', () => {
    const merged = fusionarMovimientosTrasBootstrap(
      [{ id: 1, estado: 'pendiente', monto: 5 }],
      [{ id: 1, estado: 'aprobado', monto: 5 }]
    );
    expect(merged).toEqual([{ id: 1, estado: 'aprobado', monto: 5 }]);
  });
});
