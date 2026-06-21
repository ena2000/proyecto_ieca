import {
  aplicarValoresTextoAlMovimiento,
  leerValorIonInput,
  leerValorIonInputAsync,
  normalizarMontoFormulario,
  validarTamanoComprobante
} from './movimiento-form-sync.util';

describe('movimiento-form-sync.util', () => {
  it('lee valor de ion-input', () => {
    const event = { detail: { value: '123' } } as CustomEvent;
    expect(leerValorIonInput(event)).toBe('123');
  });

  it('normaliza monto numérico', () => {
    expect(normalizarMontoFormulario('50.5')).toBe(50.5);
    expect(normalizarMontoFormulario(null)).toBeNull();
  });

  it('rechaza comprobante demasiado grande', () => {
    expect(validarTamanoComprobante('x'.repeat(500_001))).toContain('demasiado grande');
    expect(validarTamanoComprobante('')).toBeNull();
  });

  it('lee valor async desde ion-input', async () => {
    const input = {
      getInputElement: async () => ({ value: '75.25' } as HTMLInputElement)
    };
    expect(await leerValorIonInputAsync(input)).toBe('75.25');
  });

  it('aplica monto y descripción leídos del DOM', () => {
    const base = { monto: null as number | null, descripcion: '' };
    const out = aplicarValoresTextoAlMovimiento(base, '120', 'Ofrenda dominical');
    expect(out.monto).toBe(120);
    expect(out.descripcion).toBe('Ofrenda dominical');
  });
});
