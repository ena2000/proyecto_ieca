/**
 * Fija la regla institucional compartida FE/BE (sin empaquetar código).
 * Si cambias el % o la cuenta 4105, actualiza ambos constants y este test.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  APORTACION_IGLESIA_PORCENTAJE,
  CUENTA_INGRESO_TALENTO_CODIGO,
  MINISTERIO_IGLESIA_NOMBRE,
  calcularMontoAportacionIglesia
} = require('../src/constants/aportacion-iglesia');

describe('aportacion constantes (alineación FE/BE)', () => {
  it('backend fija 33 %, cuenta 4105 y ministerio General', () => {
    assert.equal(APORTACION_IGLESIA_PORCENTAJE, 0.33);
    assert.equal(CUENTA_INGRESO_TALENTO_CODIGO, '4105');
    assert.equal(MINISTERIO_IGLESIA_NOMBRE, 'General');
    assert.equal(calcularMontoAportacionIglesia(100), 33);
    assert.equal(calcularMontoAportacionIglesia(182), 60.06);
  });

  it('frontend declara los mismos literales en constants', () => {
    const fePath = path.join(
      __dirname,
      '../../src/app/shared/constants/aportacion-iglesia.constants.ts'
    );
    const src = fs.readFileSync(fePath, 'utf8');
    assert.match(src, /APORTACION_IGLESIA_PORCENTAJE\s*=\s*0\.33/);
    assert.match(src, /CUENTA_INGRESO_TALENTO_CODIGO\s*=\s*'4105'/);
    assert.match(src, /MINISTERIO_IGLESIA_NOMBRE\s*=\s*'General'/);
  });
});
