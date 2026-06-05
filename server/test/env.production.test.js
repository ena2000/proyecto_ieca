/**
 * Validaciones de configuración para NODE_ENV=production.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('getProductionConfigErrors', () => {
  const { getProductionConfigErrors } = require('../src/config/env');

  it('no exige nada fuera de producción', () => {
    const errors = getProductionConfigErrors({ NODE_ENV: 'development' });
    assert.equal(errors.length, 0);
  });

  it('exige CORS_ORIGINS en producción', () => {
    const errors = getProductionConfigErrors({
      NODE_ENV: 'production',
      CORS_ORIGINS: '',
      DEV_RESET_CODE_IN_RESPONSE: 'false'
    });
    assert.ok(errors.some((e) => /CORS_ORIGINS/i.test(e)));
  });

  it('rechaza CORS solo localhost en producción', () => {
    const errors = getProductionConfigErrors({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'http://localhost:4200',
      DEV_RESET_CODE_IN_RESPONSE: 'false'
    });
    assert.ok(errors.some((e) => /localhost/i.test(e)));
  });

  it('rechaza IECA_USE_MEMORY_DB en producción', () => {
    const errors = getProductionConfigErrors({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://app.ieca.org',
      IECA_USE_MEMORY_DB: 'true'
    });
    assert.ok(errors.some((e) => /MEMORY_DB/i.test(e)));
  });

  it('rechaza DEV_RESET_CODE_IN_RESPONSE en producción', () => {
    const errors = getProductionConfigErrors({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://app.ieca.org',
      DEV_RESET_CODE_IN_RESPONSE: 'true'
    });
    assert.ok(errors.some((e) => /DEV_RESET/i.test(e)));
  });

  it('acepta FIREBASE_SERVICE_ACCOUNT_JSON sin archivo local', () => {
    const errors = getProductionConfigErrors({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://app.ieca.org',
      FIREBASE_SERVICE_ACCOUNT_JSON: '{"type":"service_account","project_id":"demo"}'
    });
    assert.ok(!errors.some((e) => /Firebase/i.test(e)));
  });
});
