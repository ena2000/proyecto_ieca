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
    filtroEstado: 'todos' as const,
    filtroMinisterioId: null
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
      resolverEstado: i => (i.estado === 'pendiente' ? 'pendiente' : i.estado === 'rechazado' ? 'rechazado' : 'aprobado'),
      enriquecer: i => i
    });
    expect(r.length).toBe(2);
    expect(r.every(i => i.ministerioId === 1)).toBeTrue();
  });

  it('filtra por estado pendiente y por texto', () => {
    const r = filtrarMovimientos({
      items,
      ministerioScopeId: null,
      filtros: { ...filtrosVacios, filtroEstado: 'pendiente', searchTerm: 'otro' },
      textoBusqueda: i => [i.descripcion],
      resolverEstado: i => (i.estado === 'pendiente' ? 'pendiente' : 'aprobado'),
      enriquecer: i => i
    });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe(2);
  });

  it('filtra por estado rechazado', () => {
    const conRechazado: ItemPrueba[] = [
      ...items,
      { id: 4, fecha: '2026-06-02T00:00:00.000Z', monto: 10, descripcion: 'Rechazado', ministerioId: 1, estado: 'rechazado' }
    ];
    const r = filtrarMovimientos({
      items: conRechazado,
      ministerioScopeId: null,
      filtros: { ...filtrosVacios, filtroEstado: 'rechazado' },
      textoBusqueda: () => [],
      resolverEstado: i => (i.estado === 'rechazado' ? 'rechazado' : i.estado === 'pendiente' ? 'pendiente' : 'aprobado'),
      enriquecer: i => i
    });
    expect(r.map(i => i.id)).toEqual([4]);
  });

  it('filtra por rango de monto', () => {
    const r = filtrarMovimientos({
      items,
      ministerioScopeId: null,
      filtros: { ...filtrosVacios, filtroMontoMin: 80, filtroMontoMax: 150 },
      textoBusqueda: () => [],
      resolverEstado: () => 'aprobado',
      enriquecer: i => i
    });
    expect(r.map(i => i.id)).toEqual([1]);
  });

  it('filtra por ministerio cuando no hay scope de rol', () => {
    const r = filtrarMovimientos({
      items,
      ministerioScopeId: null,
      filtros: { ...filtrosVacios, filtroMinisterioId: 1 },
      textoBusqueda: () => [],
      resolverEstado: () => 'aprobado',
      enriquecer: i => i
    });
    expect(r.map(i => i.id)).toEqual([3, 1]);
  });

  it('ordena por fecha descendente (más recientes primero)', () => {
    const desordenados: ItemPrueba[] = [
      { id: 1, fecha: '2026-03-01T00:00:00.000Z', monto: 10, descripcion: 'Marzo' },
      { id: 5, fecha: '2026-06-15T00:00:00.000Z', monto: 20, descripcion: 'Junio' },
      { id: 3, fecha: '2026-06-15T00:00:00.000Z', monto: 30, descripcion: 'Junio B' }
    ];
    const r = filtrarMovimientos({
      items: desordenados,
      ministerioScopeId: null,
      filtros: filtrosVacios,
      textoBusqueda: () => [],
      resolverEstado: () => 'aprobado',
      enriquecer: i => i
    });
    expect(r.map(i => i.id)).toEqual([5, 3, 1]);
  });
});
