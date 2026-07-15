/**
 * Pruebas HTTP con Supertest y Firestore en memoria.
 */
const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');

describe('API HTTP (integración en memoria)', () => {
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

  it('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('POST /api/auth/login rechaza body inválido (400)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: '', password: '' });
    assert.equal(res.status, 400);
    assert.ok(res.body.message);
  });

  it('POST /api/auth/login rechaza credenciales incorrectas (401)', async () => {
    const hash = await bcrypt.hash('secreto', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        email: 'a@test.com',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: 'mal' });

    assert.equal(res.status, 401);
  });

  it('POST /api/auth/login devuelve token con credenciales válidas', async () => {
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

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.ok(res.body.refreshToken);
    assert.equal(res.body.user.rol, 'Administrador');
  });

  it('POST /api/auth/refresh renueva tokens con refresh válido', async () => {
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

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });

    assert.equal(refresh.status, 200);
    assert.ok(refresh.body.token);
    assert.ok(refresh.body.refreshToken);
    assert.notEqual(refresh.body.token, login.body.token);
  });

  it('POST /api/auth/refresh rechaza refresh inválido (401)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token-invalido' });
    assert.equal(res.status, 401);
  });

  it('GET /api/ingresos exige autenticación (401)', async () => {
    const res = await request(app).get('/api/ingresos');
    assert.equal(res.status, 401);
  });

  it('POST /api/admin/cierre cierra periodo y marca movimientos', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);
    seedMemoryCollection('ingresos', [
      { id: 10, fecha: '2026-05-15T12:00:00.000Z', monto: 100, descripcion: 'A' },
      { id: 11, fecha: '2026-06-15T12:00:00.000Z', monto: 50, descripcion: 'B' }
    ]);
    seedMemoryCollection('gastos', [
      { id: 20, fecha: '2026-05-20T12:00:00.000Z', monto: 30, descripcion: 'G' }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    const token = login.body.token;

    const cierre = await request(app)
      .post('/api/admin/cierre')
      .set('Authorization', `Bearer ${token}`)
      .send({ periodo: 'Mayo 2026' });

    assert.equal(cierre.status, 200);
    assert.equal(cierre.body.periodoCerrado, '2026-05');
    assert.equal(cierre.body.movimientosMarcados, 2);

    const dup = await request(app)
      .post('/api/admin/cierre')
      .set('Authorization', `Bearer ${token}`)
      .send({ periodo: 'Mayo 2026' });

    assert.equal(dup.status, 409);
  });

  it('POST /api/admin/alertas/enviar con pendiente antiguo', async () => {
    const hash = await bcrypt.hash('123456', 4);
    const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        email: 'admin@ieca.com',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      },
      {
        id: 2,
        usuario: 'conta',
        email: 'conta@ieca.com',
        rol: 'Contable',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);
    seedMemoryCollection('gastos', [
      {
        id: 5,
        estado: 'pendiente',
        fecha: '2026-05-10T12:00:00.000Z',
        auditCreadoEn: hace72h,
        monto: 250,
        descripcion: 'Compra pendiente',
        ministerioId: 1
      }
    ]);
    seedMemoryCollection('ministerios', [
      { id: 1, nombre: 'Juventud', estado: 'Activo' }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const res = await request(app)
      .post('/api/admin/alertas/enviar')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ force: true });

    assert.equal(res.status, 200);
    assert.equal(res.body.skipped, false);
    assert.ok(res.body.resumen.pendientes.length >= 1);
    assert.equal(res.body.destinatarios.length, 2);
    assert.equal(res.body.mailResult.sent, true);
    assert.equal(res.body.mailResult.channel, 'email');
  });

  it('GET /api/admin/auditoria sin filtros devuelve ingresos y gastos', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);
    seedMemoryCollection('ingresos', [
      {
        id: 10,
        fecha: '2026-05-15T12:00:00.000Z',
        fechaFormateada: '15/05/2026',
        monto: 100,
        descripcion: 'Ofrenda'
      }
    ]);
    seedMemoryCollection('gastos', [
      {
        id: 20,
        fecha: '2026-05-20T12:00:00.000Z',
        fechaFormateada: '20/05/2026',
        monto: 30,
        descripcion: 'Material'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const res = await request(app)
      .get('/api/admin/auditoria')
      .set('Authorization', `Bearer ${login.body.token}`);

    assert.equal(res.status, 200);
    const csv = String(res.text);
    const lines = csv.trim().split(/\r?\n/);
    assert.ok(lines.length >= 2, 'debe incluir cabecera y al menos un movimiento');
    assert.ok(csv.includes('Ofrenda') || csv.includes('Material'));
  });

  it('POST /api/ministerios permite crear sin líder ni co-líder', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const res = await request(app)
      .post('/api/ministerios')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ nombre: 'DAMAS', estado: 'Activo' });

    assert.equal(res.status, 201);
    assert.equal(res.body.nombre, 'DAMAS');
    assert.ok(res.body.id);
  });

  it('DELETE /api/ministerios/:id elimina de forma permanente', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);
    // Simula documentos legacy con `id` dentro del payload (no debe impedir el borrado).
    seedMemoryCollection('ministerios', [
      {
        id: 7,
        nombre: 'JOVENES',
        estado: 'Activo',
        fecha: '2026-01-01T00:00:00.000Z'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });
    const token = login.body.token;

    const del = await request(app)
      .delete('/api/ministerios/7')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(del.status, 200);
    assert.equal(del.body.ok, true);

    const getOne = await request(app)
      .get('/api/ministerios/7')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(getOne.status, 404);

    const list = await request(app)
      .get('/api/ministerios')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(list.status, 200);
    assert.equal(list.body.some((m) => Number(m.id) === 7), false);
  });

  it('DELETE /api/ministerios/:id bloquea si tiene ingresos (historial)', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);
    seedMemoryCollection('ministerios', [
      {
        id: 8,
        nombre: 'ALABANZA',
        estado: 'Activo',
        fecha: '2026-01-01T00:00:00.000Z'
      }
    ]);
    seedMemoryCollection('ingresos', [
      {
        id: 1,
        ministerioId: 8,
        monto: 100,
        descripcion: 'Ofrenda',
        estado: 'aprobado',
        fecha: '2026-01-15T00:00:00.000Z'
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const del = await request(app)
      .delete('/api/ministerios/8')
      .set('Authorization', `Bearer ${login.body.token}`);

    assert.equal(del.status, 403);
    assert.match(String(del.body.message || ''), /historial|Inactivo/i);

    const getOne = await request(app)
      .get('/api/ministerios/8')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(getOne.status, 200);
    assert.equal(getOne.body.nombre, 'ALABANZA');
  });

  it('POST /api/usuarios permite Líder/CoLíder sin ministerio', async () => {
    const hash = await bcrypt.hash('123456', 4);
    seedMemoryCollection('usuarios', [
      {
        id: 1,
        usuario: 'admin',
        rol: 'Administrador',
        estado: 'Activo',
        passwordHash: hash
      }
    ]);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: '123456' });

    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        nombre: 'Ana Colaboradora',
        email: 'ana@ieca.com',
        rol: 'Colaborador',
        estado: 'Activo'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.rol, 'Colaborador');
    assert.equal(res.body.ministerioId, null);
  });
});
