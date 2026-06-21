import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isAuthPublicRequest } from '../../shared/utils/error-message.util';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        isAuthPublicRequest(req.url) ||
        req.url.includes('/auth/refresh')
      ) {
        return throwError(() => error);
      }

      return from(auth.refreshAccessToken()).pipe(
        switchMap((ok) => {
          if (!ok) {
            auth.logout();
            return throwError(() => error);
          }
          const token = localStorage.getItem('auth_token');
          const retry = token
            ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            : req;
          return next(retry);
        })
      );
    })
  );
};
