/**
 * Pruebas de periodos contables (lógica pura, sin Firebase).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  labelToPeriodoKey,
  fechaToPeriodoKey,
  etiquetaParaMes,
  entityBloqueadoPorCierre
} = require('../src/utils/periodo.util');

describe('labelToPeriodoKey / fechaToPeriodoKey', () => {
  it('convierte etiqueta "Mayo 2026" a 2026-05', () => {
    assert.equal(labelToPeriodoKey('Mayo 2026'), '2026-05');
  });

  it('devuelve null para etiqueta inválida', () => {
    assert.equal(labelToPeriodoKey('Mes inventado 2026'), null);
  });

  it('obtiene clave YYYY-MM desde fecha ISO', () => {
    assert.equal(fechaToPeriodoKey('2026-03-15T10:00:00.000Z'), '2026-03');
  });
});

describe('etiquetaParaMes', () => {
  it('formatea 2026-05 como "Mayo 2026"', () => {
    assert.equal(etiquetaParaMes('2026-05'), 'Mayo 2026');
  });
});

describe('entityBloqueadoPorCierre', () => {
  const cerrados = ['2026-01', '2026-02'];

  it('bloquea si cerrado=true', () => {
    assert.equal(
      entityBloqueadoPorCierre({ cerrado: true, fecha: '2026-06-01' }, cerrados),
      true
    );
  });

  it('bloquea si la fecha cae en periodo cerrado', () => {
    assert.equal(
      entityBloqueadoPorCierre({ fecha: '2026-02-10' }, cerrados),
      true
    );
  });

  it('permite movimiento en periodo abierto', () => {
    assert.equal(
      entityBloqueadoPorCierre({ fecha: '2026-06-01' }, cerrados),
      false
    );
  });
});
