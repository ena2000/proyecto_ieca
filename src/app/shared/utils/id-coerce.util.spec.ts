import { aIdNumericoONull, mismoIdNumerico } from './id-coerce.util';

describe('id-coerce.util', () => {
  it('aIdNumericoONull normaliza string y vacíos', () => {
    expect(aIdNumericoONull('3')).toBe(3);
    expect(aIdNumericoONull(3)).toBe(3);
    expect(aIdNumericoONull('')).toBeNull();
    expect(aIdNumericoONull(null)).toBeNull();
    expect(aIdNumericoONull(undefined)).toBeNull();
  });

  it('mismoIdNumerico compara number y string', () => {
    expect(mismoIdNumerico(3, '3')).toBeTrue();
    expect(mismoIdNumerico(3, 3)).toBeTrue();
    expect(mismoIdNumerico(3, 4)).toBeFalse();
    expect(mismoIdNumerico(null, 3)).toBeFalse();
  });
});
