import { estaPendienteParaAprobacion } from './movimiento-estado.util';

describe('movimiento-estado.util', () => {
  it('detecta pendiente por estado', () => {
    expect(estaPendienteParaAprobacion({ estado: 'pendiente' })).toBeTrue();
    expect(estaPendienteParaAprobacion({ estado: 'Pendiente' })).toBeTrue();
  });

  it('detecta pendiente por etiqueta visible', () => {
    expect(estaPendienteParaAprobacion({ estadoEtiqueta: 'Pendiente' })).toBeTrue();
  });

  it('rechaza aprobados', () => {
    expect(estaPendienteParaAprobacion({ estado: 'aprobado', estadoEtiqueta: 'Aprobado' })).toBeFalse();
  });
});
