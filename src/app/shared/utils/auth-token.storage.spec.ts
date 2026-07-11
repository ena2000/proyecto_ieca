import {
  AUTH_TOKEN_KEY,
  authStorageClearSession,
  authStorageGet,
  authStorageRemove,
  authStorageSet
} from './auth-token.storage';

describe('auth-token.storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('guarda y lee desde sessionStorage', () => {
    authStorageSet(AUTH_TOKEN_KEY, 'abc');
    expect(authStorageGet(AUTH_TOKEN_KEY)).toBe('abc');
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('abc');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('migra desde localStorage y limpia el legado', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'legacy');
    expect(authStorageGet(AUTH_TOKEN_KEY)).toBe('legacy');
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('legacy');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('clear elimina sesión en ambos storages', () => {
    authStorageSet(AUTH_TOKEN_KEY, 'x');
    localStorage.setItem(AUTH_TOKEN_KEY, 'y');
    authStorageClearSession();
    expect(authStorageGet(AUTH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('remove limpia una clave', () => {
    authStorageSet(AUTH_TOKEN_KEY, 'z');
    authStorageRemove(AUTH_TOKEN_KEY);
    expect(authStorageGet(AUTH_TOKEN_KEY)).toBeNull();
  });
});
