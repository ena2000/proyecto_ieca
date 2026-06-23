import {
  completarRegistroTrasMutacion,
  prependRegistroUnico
} from './entity-crud.util';

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
});
