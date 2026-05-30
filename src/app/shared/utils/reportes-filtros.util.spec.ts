import {
  filtrarReportes,
  resolverFiltroMesPorPreset,
  esRegistroIngresoReporte,
  hayFiltrosReporteActivos
} from './reportes-filtros.util';
import { Reporte } from '../../core/models';

describe('reportes-filtros.util', () => {
  const base: Reporte[] = [
    {
      id: 1,
      fecha: '2026-05-01',
      mes: '2026-05',
      titulo: 'Ofrenda',
      tipo: 'Ingreso',
      ministerio: 'Jóvenes',
      ministerioId: 1,
      ingresos: 100,
      gastos: 0,
      saldo: 100,
      archivo: '',
      fechaFormateada: '01/05/2026'
    },
    {
      id: 2,
      fecha: '2026-05-02',
      mes: '2026-05',
      titulo: 'Servicio',
      tipo: 'Gasto',
      ministerio: 'Jóvenes',
      ministerioId: 1,
      ingresos: 0,
      gastos: 40,
      saldo: -40,
      archivo: '',
      fechaFormateada: '02/05/2026'
    }
  ];

  it('resolverFiltroMesPorPreset este_mes devuelve YYYY-MM', () => {
    const mes = resolverFiltroMesPorPreset('este_mes', new Date(2026, 4, 15));
    expect(mes).toBe('2026-05');
  });

  it('filtrarReportes solo ingresos', () => {
    const r = filtrarReportes(base, {
      searchTerm: '',
      filtroMes: '',
      filtroMinisterioId: null,
      filtroMovimiento: 'ingresos',
      periodoPreset: 'todos',
      ministerioScopeId: null
    });
    expect(r.length).toBe(1);
    expect(esRegistroIngresoReporte(r[0])).toBeTrue();
  });

  it('hayFiltrosReporteActivos detecta preset distinto de este_mes', () => {
    expect(
      hayFiltrosReporteActivos({
        searchTerm: '',
        filtroMes: '',
        filtroMinisterioId: null,
        filtroMovimiento: 'todos',
        periodoPreset: 'todos',
        ministerioScopeId: null
      })
    ).toBeTrue();
  });
});
