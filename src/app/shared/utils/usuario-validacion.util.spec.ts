import {
  esEmailValido,
  esPasswordValida,
  mensajeErrorBackupIeca,
  mensajeErrorEmail,
  mensajeErrorNombrePersona,
  mensajeErrorPassword
} from './usuario-validacion.util';

describe('usuario-validacion.util', () => {
  it('acepta Gmail/Outlook, dominio demo IECA y rechaza inventados', () => {
    expect(esEmailValido('ana@gmail.com')).toBeTrue();
    expect(esEmailValido('ana@outlook.com')).toBeTrue();
    expect(esEmailValido('ana@hotmail.com')).toBeTrue();
    expect(esEmailValido('ana@yahoo.es')).toBeTrue();
    expect(esEmailValido('admin@ieca.demo')).toBeTrue();
    expect(esEmailValido('admin@ieca.com')).toBeTrue();
    expect(esEmailValido('a@b.c')).toBeFalse();
    expect(esEmailValido('ana@dominio-falso.test')).toBeFalse();
    expect(esEmailValido('ana@ieca-inventado.com')).toBeFalse();
    expect(mensajeErrorEmail('ana@basura.xyz')).toMatch(/Gmail|Outlook|proveedor/i);
  });

  it('valida nombres de persona', () => {
    expect(mensajeErrorNombrePersona('Ana')).toBeNull();
    expect(mensajeErrorNombrePersona('ab')).toMatch(/al menos/);
    expect(mensajeErrorNombrePersona('<script>')).toMatch(/solo letras|no permitidos/i);
  });

  it('rechaza contraseñas vacías o solo espacios', () => {
    expect(esPasswordValida('abcdef')).toBeTrue();
    expect(esPasswordValida('      ')).toBeFalse();
    expect(mensajeErrorPassword('   ')).toMatch(/espacios/i);
  });

  it('valida estructura mínima de backup', () => {
    expect(mensajeErrorBackupIeca(null)).toMatch(/válido/i);
    expect(
      mensajeErrorBackupIeca({
        version: '1',
        ingresos: [],
        gastos: [],
        ministerios: [],
        usuarios: []
      })
    ).toBeNull();
    expect(mensajeErrorBackupIeca({ version: '1', ingresos: [] })).toMatch(/gastos/i);
  });
});
