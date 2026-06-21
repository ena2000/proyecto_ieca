import {
  esMinisterioExcluidoCatalogo,
  filtrarMinisteriosCatalogo
} from './ministerios-catalogo.constants';

describe('ministerios-catalogo.constants', () => {
  it('excluye Contabilidad del catálogo', () => {
    expect(esMinisterioExcluidoCatalogo('Contabilidad')).toBe(true);
    expect(esMinisterioExcluidoCatalogo('contabilidad')).toBe(true);
    expect(esMinisterioExcluidoCatalogo('Adolescentes')).toBe(false);
  });

  it('filtra ministerios excluidos', () => {
    const lista = [
      { id: 1, nombre: 'Adolescentes' },
      { id: 7, nombre: 'Contabilidad' },
      { id: 22, nombre: 'General' }
    ];
    expect(filtrarMinisteriosCatalogo(lista).map(m => m.nombre)).toEqual([
      'Adolescentes',
      'General'
    ]);
  });
});
