import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { getHttpErrorMessage, isAuthPublicRequest } from '../../shared/utils/error-message.util';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const publicAuth = isAuthPublicRequest(req.url);

      if (error.status === 401 && !publicAuth) {
        auth.logout();
        if (!router.url.startsWith('/login')) {
          router.navigate(['/login']);
        }
      }

      const message = getHttpErrorMessage(error, 'Error de conexión con el servidor');

      return throwError(() => new Error(message));
    })
  );
};
