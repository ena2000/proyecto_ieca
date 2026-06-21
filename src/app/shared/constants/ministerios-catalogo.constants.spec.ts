import {
  esMinisterioExcluidoCatalogo,
  esMinisterioIglesiaGeneral,
  filtrarMinisteriosCatalogo,
  filtrarMinisteriosRegistroManual,
  filtrarMinisteriosReportes
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

  it('registro manual excluye Contabilidad y General', () => {
    const lista = [
      { id: 1, nombre: 'Adolescentes' },
      { id: 7, nombre: 'Contabilidad' },
      { id: 22, nombre: 'General' }
    ];
    expect(filtrarMinisteriosRegistroManual(lista).map(m => m.nombre)).toEqual(['Adolescentes']);
  });

  it('reportes incluye General pero no Contabilidad', () => {
    const lista = [
      { id: 1, nombre: 'Adolescentes' },
      { id: 7, nombre: 'Contabilidad' },
      { id: 22, nombre: 'General' }
    ];
    expect(filtrarMinisteriosReportes(lista).map(m => m.nombre)).toEqual([
      'Adolescentes',
      'General'
    ]);
    expect(esMinisterioIglesiaGeneral('General')).toBe(true);
  });
});
