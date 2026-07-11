/**
 * Rate limit de login (aislado: baja RATE_LIMIT_LOGIN_MAX en runtime).
 * El max del limiter se lee por petición, así no choca con setup.js.
 */
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');

describe('rate limit login', () => {
  let app;
  let resetMemoryDb;
  let seedMemoryCollection;
  let prevMax;

  before(() => {
    prevMax = process.env.RATE_LIMIT_LOGIN_MAX;
    process.env.RATE_LIMIT_LOGIN_MAX = '2';
    process.env.RATE_LIMIT_KEY_SUFFIX = `rl-${Date.now()}`;
    const memory = require('../src/config/firebase.memory');
    resetMemoryDb = memory.resetMemoryDb;
    seedMemoryCollection = memory.seedMemoryCollection;
    // Reutilizar createApp ya cargado; el max se evalúa en cada request
    const { createApp } = require('../src/createApp');
    app = createApp({ useMemoryDb: true });
  });

  after(() => {
    if (prevMax == null) delete process.env.RATE_LIMIT_LOGIN_MAX;
    else process.env.RATE_LIMIT_LOGIN_MAX = prevMax;
    delete process.env.RATE_LIMIT_KEY_SUFFIX;
  });

  beforeEach(() => {
    resetMemoryDb();
  });

  it('GET /api/health no cuenta en el límite general', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('login falla con 429 tras superar el máximo de intentos', async () => {
    const hash = await bcrypt.hash('secreto', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);

    const r1 = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: 'mal' });
    assert.equal(r1.status, 401);

    const r2 = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: 'mal' });
    assert.equal(r2.status, 401);

    const r3 = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: 'mal' });
    assert.equal(r3.status, 429);
    assert.match(String(r3.body.message), /Demasiadas/i);
  });
});
