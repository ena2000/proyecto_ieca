import { esFormularioMovimientoValido, mensajeValidacionMovimiento } from './movimiento-validacion.util';

describe('movimiento-validacion.util', () => {
  const valido = {
    descripcion: 'Ofrenda dominical',
    monto: 150,
    fechaManualForm: '15/05/2026',
    cuentaCodigo: '4102',
    ministerioId: 1,
    listaMinisteriosLength: 2,
    ministerioScopeId: null as number | null
  };

  it('acepta formulario completo válido', () => {
    expect(esFormularioMovimientoValido(valido)).toBeTrue();
  });

  it('rechaza monto cero o negativo', () => {
    expect(esFormularioMovimientoValido({ ...valido, monto: 0 })).toBeFalse();
    expect(mensajeValidacionMovimiento({ ...valido, monto: 0 })).toMatch(/monto válido/i);
  });

  it('rechaza monto excesivo', () => {
    expect(esFormularioMovimientoValido({ ...valido, monto: 1_000_000_000 })).toBeFalse();
    expect(mensajeValidacionMovimiento({ ...valido, monto: 1_000_000_000 })).toMatch(/superar/i);
  });

  it('exige ministerio si hay lista y no hay alcance fijo', () => {
    expect(
      esFormularioMovimientoValido({
        ...valido,
        ministerioId: undefined,
        listaMinisteriosLength: 3
      })
    ).toBeFalse();
    expect(
      mensajeValidacionMovimiento({
        ...valido,
        ministerioId: undefined,
        listaMinisteriosLength: 3
      })
    ).toMatch(/ministerio/i);
  });

  it('no exige ministerio si el líder tiene ministerioScopeId', () => {
    expect(
      esFormularioMovimientoValido({
        ...valido,
        ministerioId: undefined,
        ministerioScopeId: 2,
        listaMinisteriosLength: 3
      })
    ).toBeTrue();
  });

  it('rechaza descripción corta o con tags', () => {
    expect(esFormularioMovimientoValido({ ...valido, descripcion: 'ab' })).toBeFalse();
    expect(esFormularioMovimientoValido({ ...valido, descripcion: 'ok <script>' })).toBeFalse();
  });

  it('exige cuenta contable', () => {
    expect(esFormularioMovimientoValido({ ...valido, cuentaCodigo: '' })).toBeFalse();
    expect(mensajeValidacionMovimiento({ ...valido, cuentaCodigo: '' })).toMatch(/cuenta/i);
  });

  it('rechaza fecha futura', () => {
    const futuro = {
      ...valido,
      fechaManualForm: '01/01/2099'
    };
    expect(esFormularioMovimientoValido(futuro)).toBeFalse();
    expect(mensajeValidacionMovimiento(futuro)).toMatch(/posterior a hoy/i);
  });

  it('rechaza fecha de calendario inválida', () => {
    const imposible = { ...valido, fechaManualForm: '31/02/2026' };
    expect(esFormularioMovimientoValido(imposible)).toBeFalse();
    expect(mensajeValidacionMovimiento(imposible)).toMatch(/no es válida|día y mes/i);
  });

  it('rechaza solo espacios en descripción', () => {
    expect(esFormularioMovimientoValido({ ...valido, descripcion: '     ' })).toBeFalse();
  });
});
