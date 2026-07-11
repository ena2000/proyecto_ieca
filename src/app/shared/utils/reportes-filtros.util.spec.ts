import {
  filtrarReportes,
  resolverFiltroMesPorPreset,
  esRegistroIngresoReporte,
  hayFiltrosReporteActivos,
  mesesDisponiblesDesdeReportes,
  aniosDisponiblesDesdeReportes,
  mesesDelAnioParaReporte,
  componerFiltroMesAnio
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

  it('mesesDisponiblesDesdeReportes incluye el mes seleccionado aunque no haya datos', () => {
    const meses = mesesDisponiblesDesdeReportes(base, '2026-01');
    expect(meses.some(m => m.value === '2026-01')).toBeTrue();
    expect(meses.find(m => m.value === '2026-01')?.label).toBe('Enero 2026');
  });

  it('aniosDisponiblesDesdeReportes va desde 2000 hasta el año actual', () => {
    const anios = aniosDisponiblesDesdeReportes(base, null, new Date(2026, 6, 11));
    expect(anios[0]).toBe(2026);
    expect(anios[anios.length - 1]).toBe(2000);
    expect(anios).toContain(2010);
  });

  it('mesesDelAnioParaReporte incluye los 12 meses', () => {
    const meses = mesesDelAnioParaReporte(2026, new Date(2026, 6, 11));
    expect(meses.length).toBe(12);
    expect(meses[0].label).toBe('Enero');
    expect(meses[meses.length - 1].value).toBe('2026-12');
  });

  it('componerFiltroMesAnio respeta cualquier mes del año', () => {
    expect(componerFiltroMesAnio(2026, 12, new Date(2026, 6, 11))).toBe('2026-12');
    expect(componerFiltroMesAnio(2025, 3, new Date(2026, 6, 11))).toBe('2025-03');
  });
});
