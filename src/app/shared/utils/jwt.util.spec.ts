import { decodeJwtPayload, isJwtExpired } from './jwt.util';

function tokenWithExp(expSec: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: expSec }));
  return `${header}.${payload}.sig`;
}

describe('jwt.util', () => {
  it('detecta token expirado', () => {
    const expired = tokenWithExp(Math.floor(Date.now() / 1000) - 60);
    expect(isJwtExpired(expired)).toBeTrue();
  });

  it('acepta token vigente', () => {
    const valid = tokenWithExp(Math.floor(Date.now() / 1000) + 3600);
    expect(isJwtExpired(valid)).toBeFalse();
  });

  it('trata token inválido como expirado', () => {
    expect(isJwtExpired('no-es-jwt')).toBeTrue();
    expect(decodeJwtPayload('no-es-jwt')).toBeNull();
  });
});
