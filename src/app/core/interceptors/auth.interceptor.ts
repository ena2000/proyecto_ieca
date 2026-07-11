import { HttpInterceptorFn } from '@angular/common/http';
import { AUTH_TOKEN_KEY, authStorageGet } from '../../shared/utils/auth-token.storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authStorageGet(AUTH_TOKEN_KEY);
  if (!token) {
    return next(req);
  }
  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
