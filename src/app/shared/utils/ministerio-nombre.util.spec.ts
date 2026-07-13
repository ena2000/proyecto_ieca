import {
  MINISTERIO_NOMBRE_MAX,
  validarNombreMinisterio
} from './ministerio-nombre.util';

describe('ministerio-nombre.util', () => {
  it('acepta nombres normales con tildes', () => {
    expect(validarNombreMinisterio('Alabanza')).toBeNull();
    expect(validarNombreMinisterio('Niños y Jóvenes')).toBeNull();
  });

  it('rechaza muy corto o vacío', () => {
    expect(validarNombreMinisterio('ab')).toContain('al menos');
    expect(validarNombreMinisterio('  ')).toContain('al menos');
  });

  it('rechaza solo símbolos', () => {
    expect(validarNombreMinisterio('***')).toContain('letra');
    expect(validarNombreMinisterio('*****************************')).toContain('letra');
  });

  it('rechaza caracteres no permitidos', () => {
    expect(validarNombreMinisterio('Alabanza!!!')).toContain('solo letras');
    expect(validarNombreMinisterio('Test<script>')).toContain('solo letras');
  });

  it('rechaza spam de caracteres repetidos', () => {
    expect(validarNombreMinisterio('eiqwheuoqqweqweqweqweqweqweqweqweqweqweqweqqqqqqqqqqqqqqq'))
      .toContain('repetir');
  });

  it('rechaza nombres demasiado largos', () => {
    const largo = 'A'.repeat(MINISTERIO_NOMBRE_MAX + 1);
    expect(validarNombreMinisterio(largo)).toContain('superar');
  });
});
