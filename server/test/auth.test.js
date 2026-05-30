/**
 * Pruebas de autenticación (JWT y validación Zod) sin Firestore.
 * Ejecutar: cd server && npm test
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('auth.schema (Zod)', () => {
  const {
    loginSchema,
    changePasswordSchema,
    resetPasswordSchema
  } = require('../src/schemas/auth.schema');

  it('acepta login válido', () => {
    const r = loginSchema.safeParse({ usuario: 'admin', password: '123456' });
    assert.equal(r.success, true);
  });

  it('rechaza login sin usuario', () => {
    const r = loginSchema.safeParse({ usuario: '', password: 'x' });
    assert.equal(r.success, false);
  });

  it('rechaza change-password con nueva contraseña corta', () => {
    const r = changePasswordSchema.safeParse({
      oldPassword: '123456',
      newPassword: '12'
    });
    assert.equal(r.success, false);
  });

  it('exige código de 6 dígitos en reset-password', () => {
    const r = resetPasswordSchema.safeParse({
      usuario: 'admin',
      code: '12345',
      newPassword: 'nueva123'
    });
    assert.equal(r.success, false);
  });
});

describe('signToken / JWT', () => {
  const { signToken, signTokenPair, verifyAccessToken, verifyRefreshToken, ROLES } =
    require('../src/middleware/auth');

  it('genera token verificable con rol y ministerioId', () => {
    const user = { id: 7, rol: ROLES.CONTABLE, ministerioId: null };
    const token = signToken(user);
    const payload = verifyAccessToken(token);

    assert.equal(payload.sub, '7');
    assert.equal(payload.rol, ROLES.CONTABLE);
    assert.equal(payload.ministerioId, null);
    assert.equal(payload.type, 'access');
  });

  it('incluye ministerioId para líder', () => {
    const user = { id: 3, rol: ROLES.LIDER, ministerioId: 2 };
    const token = signToken(user);
    const payload = verifyAccessToken(token);
    assert.equal(payload.ministerioId, 2);
  });

  it('signTokenPair devuelve access y refresh distintos', () => {
    const user = { id: 1, rol: ROLES.ADMIN, ministerioId: null };
    const { token, refreshToken } = signTokenPair(user);
    assert.notEqual(token, refreshToken);

    const access = verifyAccessToken(token);
    const refresh = verifyRefreshToken(refreshToken);
    assert.equal(access.sub, '1');
    assert.equal(refresh.sub, '1');
    assert.equal(refresh.type, 'refresh');
  });

  it('rechaza refresh token como access token', () => {
    const user = { id: 1, rol: ROLES.ADMIN, ministerioId: null };
    const { refreshToken } = signTokenPair(user);
    assert.throws(() => verifyAccessToken(refreshToken), /acceso/i);
  });
});

describe('requireRoles', () => {
  const { requireRoles, ROLES } = require('../src/middleware/auth');

  it('permite rol autorizado', () => {
    const middleware = requireRoles([ROLES.ADMIN]);
    const req = { user: { rol: ROLES.ADMIN } };
    let nextCalled = false;
    middleware(req, {}, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });

  it('responde 403 si el rol no está permitido', () => {
    const middleware = requireRoles([ROLES.ADMIN]);
    const req = { user: { rol: ROLES.LIDER } };
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    middleware(req, res, () => {});
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /permiso/i);
  });
});
