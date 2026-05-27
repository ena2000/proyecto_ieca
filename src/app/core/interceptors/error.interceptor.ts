import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiErrorBody } from '../models/api.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout();
        router.navigate(['/login']);
      }

      const body = error.error as ApiErrorBody | string | null;
      const message =
        typeof body === 'string'
          ? body
          : body?.message ?? body?.error ?? error.message ?? 'Error de conexión con el servidor';

      return throwError(() => new Error(message));
    })
  );
};
