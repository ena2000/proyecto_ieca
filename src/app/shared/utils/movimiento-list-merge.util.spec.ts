import { fusionarMovimientosTrasBootstrap } from './movimiento-list-merge.util';

describe('fusionarMovimientosTrasBootstrap', () => {
  it('no revive registros eliminados localmente si el servidor aún los devuelve', () => {
    const servidor = [
      { id: 1, estado: 'aprobado', monto: 100 },
      { id: 2, estado: 'aprobado', monto: 200 }
    ];
    const locales = [{ id: 1, estado: 'aprobado', monto: 100 }];

    const merged = fusionarMovimientosTrasBootstrap(servidor, locales);

    expect(merged.map(i => i.id)).toEqual([1]);
  });

  it('conserva registros nuevos solo en local', () => {
    const servidor = [{ id: 1, estado: 'aprobado', monto: 100 }];
    const locales = [
      { id: 1, estado: 'pendiente', monto: 100 },
      { id: 99, estado: 'pendiente', monto: 50 }
    ];

    const merged = fusionarMovimientosTrasBootstrap(servidor, locales);

    expect(merged.map(i => Number(i.id)).sort()).toEqual([1, 99]);
  });

  it('no revive un eliminado aunque haya altas solo-locales', () => {
    const servidor = [
      { id: 1, estado: 'aprobado', monto: 100 },
      { id: 2, estado: 'aprobado', monto: 200 }
    ];
    const locales = [
      { id: 1, estado: 'aprobado', monto: 100 },
      { id: 99, estado: 'pendiente', monto: 50 }
    ];

    const merged = fusionarMovimientosTrasBootstrap(servidor, locales);

    expect(merged.map(i => Number(i.id)).sort()).toEqual([1, 99]);
  });

  it('respeta idsExcluidos aunque el servidor aún los traiga', () => {
    const servidor = [
      { id: 1, estado: 'aprobado', monto: 100 },
      { id: 2, estado: 'aprobado', monto: 200 }
    ];
    const locales = [{ id: 1, estado: 'aprobado', monto: 100 }];

    const merged = fusionarMovimientosTrasBootstrap(servidor, locales, new Set([2]));

    expect(merged.map(i => i.id)).toEqual([1]);
  });

  it('incorpora aportación 33% del servidor cuando el origen ya está en local', () => {
    const servidor = [
      { id: 10, estado: 'aprobado', monto: 100, aportacionGenerada: true, ingresoIglesiaId: 11 },
      {
        id: 11,
        estado: 'aprobado',
        monto: 33,
        esAportacionIglesia: true,
        ingresoOrigenId: 10
      }
    ];
    const locales = [{ id: 10, estado: 'aprobado', monto: 100, aportacionGenerada: true, ingresoIglesiaId: 11 }];

    const merged = fusionarMovimientosTrasBootstrap(servidor, locales);

    expect(merged.map(i => Number(i.id)).sort()).toEqual([10, 11]);
  });
});
