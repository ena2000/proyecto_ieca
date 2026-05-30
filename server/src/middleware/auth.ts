const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('../config/env');

/** @typedef {import('../types/auth.types').AuthUser} AuthUser */
/** @typedef {import('../types/auth.types').AccessTokenPayload} AccessTokenPayload */
/** @typedef {import('../types/auth.types').RefreshTokenPayload} RefreshTokenPayload */

const ROLES = {
  ADMIN: 'Administrador',
  CONTABLE: 'Contable',
  LIDER: 'Lider/CoLider'
};

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
    rol: user.rol,
    ministerioId: user.ministerioId ?? null,
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
  return (req, res, next) => {
    const rol = req.user?.rol;
    if (!rol || !allow.has(rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }
    return next();
  };
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
  JWT_SECRET,
  ROLES,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES
};
