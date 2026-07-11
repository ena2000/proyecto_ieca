const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('../config/env');

/** @typedef {import('../types/auth.types').AuthUser} AuthUser */
/** @typedef {import('../types/auth.types').AccessTokenPayload} AccessTokenPayload */
/** @typedef {import('../types/auth.types').RefreshTokenPayload} RefreshTokenPayload */

const ROLES = {
  ADMIN: 'Administrador',
  CONTABLE: 'Contable',
  COLABORADOR: 'Colaborador'
};

const ROL_LIDER_LEGACY = 'Lider/CoLider';

function normalizarRol(rol) {
  if (!rol) return null;
  const r = String(rol).trim().toLowerCase();
  if (r === 'administrador' || r === 'admin') return ROLES.ADMIN;
  if (r === 'contable') return ROLES.CONTABLE;
  if (
    r === 'colaborador' ||
    r === 'lider/colider' ||
    r === 'lider' ||
    r === 'colider' ||
    r === 'co-lider'
  ) {
    return ROLES.COLABORADOR;
  }
  if (rol === ROLES.ADMIN || rol === ROLES.CONTABLE || rol === ROLES.COLABORADOR) {
    return rol;
  }
  return null;
}

function esColaboradorMinisterio(rol) {
  return normalizarRol(rol) === ROLES.COLABORADOR;
}

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * @param {AuthUser} user
 * @returns {string}
 */
function signAccessToken(user) {
  /** @type {Omit<AccessTokenPayload, 'iat' | 'exp'>} */
  const payload = {
    sub: String(user.id),
    rol: normalizarRol(user.rol) ?? user.rol,
    ministerioId: user.ministerioId ?? null,
    mustChangePassword: !!user.mustChangePassword,
    type: 'access',
    jti: crypto.randomUUID()
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: /** @type {import('jsonwebtoken').SignOptions['expiresIn']} */ (ACCESS_TOKEN_EXPIRES) });
}

/**
 * @param {AuthUser} user
 * @returns {string}
 */
function signRefreshToken(user) {
  /** @type {Omit<RefreshTokenPayload, 'iat' | 'exp'>} */
  const payload = {
    sub: String(user.id),
    type: 'refresh',
    jti: crypto.randomUUID()
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: /** @type {import('jsonwebtoken').SignOptions['expiresIn']} */ (REFRESH_TOKEN_EXPIRES) });
}

/**
 * @param {AuthUser} user
 * @returns {{ token: string, refreshToken: string }}
 */
function signTokenPair(user) {
  return {
    token: signAccessToken(user),
    refreshToken: signRefreshToken(user)
  };
}

/** @param {AuthUser} user @returns {string} */
function signToken(user) {
  return signAccessToken(user);
}

/**
 * @param {string} token
 * @returns {AccessTokenPayload}
 */
function verifyAccessToken(token) {
  const payload = /** @type {AccessTokenPayload} */ (jwt.verify(token, JWT_SECRET));
  if (payload.type && payload.type !== 'access') {
    throw new Error('Token de acceso inválido');
  }
  return payload;
}

/**
 * @param {string} token
 * @returns {RefreshTokenPayload}
 */
function verifyRefreshToken(token) {
  const payload = /** @type {RefreshTokenPayload} */ (jwt.verify(token, JWT_SECRET));
  if (payload.type !== 'refresh') {
    throw new Error('Refresh token inválido');
  }
  return payload;
}

/** @type {import('express').RequestHandler} */
function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

/**
 * @param {string[]} allowedRoles
 * @returns {import('express').RequestHandler}
 */
function requireRoles(allowedRoles) {
  const allow = new Set(allowedRoles);
  if (allow.has(ROLES.COLABORADOR)) {
    allow.add(ROL_LIDER_LEGACY);
  }
  return (req, res, next) => {
    const rol = normalizarRol(req.user?.rol) ?? req.user?.rol;
    if (!rol || !allow.has(rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }
    return next();
  };
}

/** Bloquea el API si el usuario debe cambiar la contraseña temporal. */
function requirePasswordChanged(req, res, next) {
  if (req.user?.mustChangePassword) {
    return res.status(403).json({
      message: 'Debes cambiar tu contraseña temporal antes de continuar'
    });
  }
  return next();
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signTokenPair,
  signToken,
  verifyAccessToken,
  verifyRefreshToken,
  authRequired,
  requireRoles,
  requirePasswordChanged,
  normalizarRol,
  esColaboradorMinisterio,
  JWT_SECRET,
  ROLES,
  ROL_LIDER_LEGACY,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES
};
