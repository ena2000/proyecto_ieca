const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizarTextoUnico } = require('../src/utils/unicidad.ts');

describe('unicidad', () => {
  it('normaliza texto para comparación sin tildes ni mayúsculas', () => {
    assert.equal(normalizarTextoUnico('  JÓVenes  '), 'jovenes');
    assert.equal(normalizarTextoUnico('Alabanza   VIP'), 'alabanza vip');
  });
});
