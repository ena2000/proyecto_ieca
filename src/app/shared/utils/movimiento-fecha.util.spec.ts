import {
  actualizarDesdeFechaNativa,
  aplicarFechaManualFiltro,
  limpiarActualizacionFechaNativa
} from './movimiento-fecha.util';

describe('movimiento-fecha.util', () => {
  it('limpia filtro desde al borrar en el selector nativo', () => {
    expect(actualizarDesdeFechaNativa('', 'desde')).toEqual({
      filtroFechaInicio: '',
      fechaManualDesde: ''
    });
  });

  it('limpia filtro hasta al borrar en el selector nativo', () => {
    expect(actualizarDesdeFechaNativa('', 'hasta')).toEqual({
      filtroFechaFin: '',
      fechaManualHasta: ''
    });
  });

  it('asigna filtro desde con fecha nativa válida', () => {
    const upd = actualizarDesdeFechaNativa('2026-05-15', 'desde');
    expect(upd.fechaManualDesde).toBe('15/05/2026');
    expect(upd.filtroFechaInicio).toBeTruthy();
  });

  it('limpia ISO al borrar texto manual del filtro desde', () => {
    expect(aplicarFechaManualFiltro('', 'desde')).toEqual({
      fechaManualDesde: '',
      filtroFechaInicio: ''
    });
  });

  it('limpia ISO con fecha manual incompleta', () => {
    expect(aplicarFechaManualFiltro('15/05', 'hasta')).toEqual({
      fechaManualHasta: '15/05',
      filtroFechaFin: ''
    });
  });

  it('limpiarActualizacionFechaNativa para formulario', () => {
    expect(limpiarActualizacionFechaNativa('form')).toEqual({ fechaManualForm: '' });
  });
});
