import { filtrarMovimientos, hayFiltrosMovimientoActivos } from './movimiento-filtros.util';

interface ItemPrueba {
  id: number;
  fecha: string;
  monto: number;
  descripcion: string;
  ministerioId?: number;
  estado?: string;
}

describe('movimiento-filtros.util', () => {
  const items: ItemPrueba[] = [
    { id: 1, fecha: '2026-05-01T00:00:00.000Z', monto: 100, descripcion: 'Ofrenda domingo', ministerioId: 1, estado: 'aprobado' },
    { id: 2, fecha: '2026-05-10T00:00:00.000Z', monto: 50, descripcion: 'Otro', ministerioId: 2, estado: 'pendiente' },
    { id: 3, fecha: '2026-06-01T00:00:00.000Z', monto: 200, descripcion: 'Junio', ministerioId: 1, estado: 'aprobado' }
  ];

  const filtrosVacios = {
    searchTerm: '',
    filtroFechaInicio: '',
    filtroFechaFin: '',
    fechaManualDesde: '',
    fechaManualHasta: '',
    filtroMontoMin: null,
    filtroMontoMax: null,
    filtroSoloPendientes: false
  };

  it('hayFiltrosMovimientoActivos detecta búsqueda activa', () => {
    expect(hayFiltrosMovimientoActivos(filtrosVacios)).toBeFalse();
    expect(hayFiltrosMovimientoActivos({ ...filtrosVacios, searchTerm: 'ofrenda' })).toBeTrue();
  });

  it('filtra por ministerioScopeId', () => {
    const r = filtrarMovimientos({
      items,
      ministerioScopeId: 1,
      filtros: filtrosVacios,
      textoBusqueda: i => [i.descripcion],
      esPendiente: () => false,
      enriquecer: i => i
    });
    expect(r.length).toBe(2);
    expect(r.every(i => i.ministerioId === 1)).toBeTrue();
  });

  it('filtra solo pendientes y por texto', () => {
    const r = filtrarMovimientos({
      items,
      ministerioScopeId: null,
      filtros: { ...filtrosVacios, filtroSoloPendientes: true, searchTerm: 'otro' },
      textoBusqueda: i => [i.descripcion],
      esPendiente: (i) => i.estado === 'pendiente',
      enriquecer: i => i
    });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe(2);
  });

  it('filtra por rango de monto', () => {
    const r = filtrarMovimientos({
      items,
      ministerioScopeId: null,
      filtros: { ...filtrosVacios, filtroMontoMin: 80, filtroMontoMax: 150 },
      textoBusqueda: () => [],
      esPendiente: () => false,
      enriquecer: i => i
    });
    expect(r.map(i => i.id)).toEqual([1]);
  });
});
