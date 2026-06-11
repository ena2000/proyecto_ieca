import { Ministerio, Usuario } from '../../core/models';
import {
  ministerioNombreDuplicado,
  normalizarTextoUnico,
  usuarioEmailDuplicado
} from './unicidad.util';

describe('unicidad.util', () => {
  const ministerios: Ministerio[] = [
    { id: 1, nombre: 'Jóvenes', estado: 'Activo', fecha: '', fechaFormateada: '' },
    { id: 2, nombre: 'Alabanza', estado: 'Activo', fecha: '', fechaFormateada: '' }
  ];

  const usuarios: Usuario[] = [
    { id: 1, nombre: 'Ana', email: 'ana@ieca.com', rol: 'Administrador', estado: 'Activo' },
    { id: 2, nombre: 'Luis', email: 'luis@ieca.com', rol: 'Contable', estado: 'Activo' }
  ];

  it('normaliza texto ignorando tildes y mayúsculas', () => {
    expect(normalizarTextoUnico('  JÓVenes  ')).toBe('jovenes');
  });

  it('detecta ministerio duplicado sin distinguir mayúsculas', () => {
    expect(ministerioNombreDuplicado('jovenes', ministerios)?.id).toBe(1);
    expect(ministerioNombreDuplicado('Nuevo', ministerios)).toBeNull();
    expect(ministerioNombreDuplicado('Jóvenes', ministerios, 1)).toBeNull();
  });

  it('detecta email duplicado sin distinguir mayúsculas', () => {
    expect(usuarioEmailDuplicado('ANA@IECA.COM', usuarios)?.id).toBe(1);
    expect(usuarioEmailDuplicado('nuevo@ieca.com', usuarios)).toBeNull();
    expect(usuarioEmailDuplicado('ana@ieca.com', usuarios, 1)).toBeNull();
  });
});
