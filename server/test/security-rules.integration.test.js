/**
 * Integración: mustChangePassword, aprobar/rechazar, aportación 33 %,
 * backup/restore, cierre con pendientes, logout/refresh.
 */
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');

async function seedAdmin(seedMemoryCollection, opts = {}) {
  const hash = await bcrypt.hash(opts.password || '123456', 4);
  seedMemoryCollection('usuarios', [
    {
      id: 1,
      usuario: 'admin',
      email: 'admin@ieca.com',
      rol: 'Administrador',
      estado: 'Activo',
      passwordHash: hash,
      mustChangePassword: !!opts.mustChangePassword
    }
  ]);
}

describe('API seguridad y reglas (integración)', () => {
  let app;
  let resetMemoryDb;
  let seedMemoryCollection;

  before(() => {
    const memory = require('../src/config/firebase.memory');
    resetMemoryDb = memory.resetMemoryDb;
    seedMemoryCollection = memory.seedMemoryCollection;
    const { createApp } = require('../src/createApp');
    app = createApp({ useMemoryDb: true });
  });

  beforeEach(() => {
    resetMemoryDb();
  });

  it('mustChangePassword bloquea CRUD y permite bootstrap', async () => {
    await seedAdmin(seedMemoryCollection, { mustChangePassword: true });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.mustChangePassword, true);
    const token = login.body.token;

    const blocked = await request(app)
      .get('/api/ingresos')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(blocked.status, 403);

    const boot = await request(app)
      .get('/api/bootstrap')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(boot.status, 200);
  });

  it('change-password limpia mustChangePassword y desbloquea API', async () => {
    await seedAdmin(seedMemoryCollection, { mustChangePassword: true });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    const token = login.body.token;

    const changed = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: '123456', newPassword: 'Iglesia2026' });
    assert.equal(changed.status, 200);
    assert.equal(changed.body.user.mustChangePassword, false);
    assert.ok(changed.body.token);

    const ok = await request(app)
      .get('/api/ingresos')
      .set('Authorization', `Bearer ${changed.body.token}`);
    assert.equal(ok.status, 200);
  });

  it('logout invalida el refresh token', async () => {
    await seedAdmin(seedMemoryCollection);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    const { refreshToken, token } = login.body;

    const logout = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });
    assert.equal(logout.status, 204);

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    assert.equal(refresh.status, 401);

    // access token sigue válido hasta expirar (esperado)
    const still = await request(app)
      .get('/api/bootstrap')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(still.status, 200);
  });

  it('GET /api/usuarios no expone passwordHash', async () => {
    await seedAdmin(seedMemoryCollection);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    for (const u of res.body) {
      assert.equal(u.passwordHash, undefined);
      assert.equal(u.refreshJti, undefined);
    }
  });

  it('Admin aprueba ingreso talento 4105 y genera aportación 33%', async () => {
    await seedAdmin(seedMemoryCollection);
    seedMemoryCollection('ministerios', [
      { id: 2, nombre: 'Juventud', estado: 'Activo' },
      { id: 22, nombre: 'General', estado: 'Activo' }
    ]);
    seedMemoryCollection('ingresos', [
      {
        id: 50,
        fecha: '2026-06-10',
        descripcion: 'Evento talento',
        monto: 300,
        ministerio: 'Juventud',
        ministerioId: 2,
        cuentaCodigo: '4105',
        cuentaNombre: 'Talento y eventos',
        categoria: 'Talento',
        estado: 'pendiente'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    const token = login.body.token;

    const apr = await request(app)
      .patch('/api/ingresos/50/aprobar')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(apr.status, 200);
    assert.equal(apr.body.estado, 'aprobado');
    assert.equal(apr.body.aportacionGenerada, true);
    assert.ok(apr.body.ingresoIglesiaId);
    assert.equal(apr.body.montoAportacionIglesia, 99);

    const lista = await request(app)
      .get('/api/ingresos')
      .set('Authorization', `Bearer ${token}`);
    const hijo = lista.body.find((r) => r.esAportacionIglesia);
    assert.ok(hijo);
    assert.equal(hijo.monto, 99);
    assert.equal(hijo.ministerioId, 22);
    assert.equal(String(hijo.ministerio).toLowerCase(), 'general');
    assert.equal(Number(hijo.id), Number(apr.body.ingresoIglesiaId));
  });

  it('No-admin no puede aprobar gastos (403)', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 2,
        usuario: 'conta',
        rol: 'Contable',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);
    seedMemoryCollection('gastos', [
      {
        id: 7,
        fecha: '2026-06-01',
        descripcion: 'Gasto test',
        monto: 40,
        ministerio: 'Juventud',
        ministerioId: 2,
        cuentaCodigo: '5101',
        estado: 'pendiente'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'conta', password: '123456' });

    const res = await request(app)
      .patch('/api/gastos/7/aprobar')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(res.status, 403);
  });

  it('No se puede aprobar un gasto rechazado', async () => {
    await seedAdmin(seedMemoryCollection);
    seedMemoryCollection('gastos', [
      {
        id: 8,
        fecha: '2026-06-01',
        descripcion: 'Gasto rechazado',
        monto: 40,
        ministerio: 'Juventud',
        ministerioId: 2,
        cuentaCodigo: '5101',
        estado: 'rechazado'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const res = await request(app)
      .patch('/api/gastos/8/aprobar')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(res.status, 400);
  });

  it('Rechazar ingreso pendiente con motivo', async () => {
    await seedAdmin(seedMemoryCollection);
    seedMemoryCollection('ingresos', [
      {
        id: 51,
        fecha: '2026-06-10',
        descripcion: 'Pendiente',
        monto: 50,
        ministerio: 'Juventud',
        ministerioId: 2,
        cuentaCodigo: '4101',
        estado: 'pendiente'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const res = await request(app)
      .patch('/api/ingresos/51/rechazar')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ motivo: 'Comprobante ilegible' });
    assert.equal(res.status, 200);
    assert.equal(res.body.estado, 'rechazado');
    assert.match(String(res.body.motivoRechazo), /Comprobante/);
  });

  it('Cierre bloquea si hay movimientos pendientes', async () => {
    await seedAdmin(seedMemoryCollection);
    seedMemoryCollection('ingresos', [
      {
        id: 60,
        fecha: '2026-04-15T12:00:00.000Z',
        monto: 100,
        descripcion: 'Pendiente abril',
        estado: 'pendiente'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const cierre = await request(app)
      .post('/api/admin/cierre')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ periodo: 'Abril 2026' });

    assert.equal(cierre.status, 409);
    assert.match(String(cierre.body.message), /pendiente/i);
  });

  it('Backup no incluye passwordHash; restore no planta hashes', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        email: 'admin@ieca.com',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);
    seedMemoryCollection('ministerios', []);
    seedMemoryCollection('ingresos', []);
    seedMemoryCollection('gastos', []);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    const token = login.body.token;

    const backup = await request(app)
      .get('/api/admin/backup')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(backup.status, 200);
    assert.ok(backup.body.version);
    assert.ok(Array.isArray(backup.body.usuarios));
    for (const u of backup.body.usuarios) {
      assert.equal(u.passwordHash, undefined);
    }

    const crafted = {
      ...backup.body,
      usuarios: [
        {
          id: 1,
          usuario: 'admin',
          email: 'admin@ieca.com',
          rol: 'Administrador',
          estado: 'Activo',
          passwordHash: '$2a$10$plantedhashshouldnotbeusedxxxxxxxxxxxx'
        }
      ]
    };

    const restore = await request(app)
      .post('/api/admin/restore')
      .set('Authorization', `Bearer ${token}`)
      .send(crafted);
    assert.equal(restore.status, 200);

    // Login sigue funcionando con la contraseña original (hash conservado, no el plantado)
    const again = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    assert.equal(again.status, 200);
  });

  it('DELETE /api/admin/datos exige confirmación y contraseña', async () => {
    await seedAdmin(seedMemoryCollection);
    seedMemoryCollection('ingresos', [
      { id: 1, monto: 10, estado: 'aprobado', descripcion: 'x' }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    const token = login.body.token;

    const sinBody = await request(app)
      .delete('/api/admin/datos')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(sinBody.status, 400);

    const malaPass = await request(app)
      .delete('/api/admin/datos')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmacion: 'ELIMINAR', password: 'incorrecta' });
    assert.equal(malaPass.status, 403);

    const ok = await request(app)
      .delete('/api/admin/datos')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmacion: 'ELIMINAR', password: '123456' });
    assert.equal(ok.status, 200);
    assert.match(String(ok.body.message || ''), /conserv/i);

    const again = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    assert.equal(again.status, 200);
  });
});
