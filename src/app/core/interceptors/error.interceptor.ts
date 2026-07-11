import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { getHttpErrorMessage } from '../../shared/utils/error-message.util';

/**
 * Solo formatea mensajes de error para la UI.
 * El 401 / renovación de sesión lo maneja refreshInterceptor (debe ir
 * más cerca del backend en la cadena para ver el HttpErrorResponse intacto).
 */
export const errorInterceptor: HttpInterceptorFn = (_req, next) => {
  return next(_req).pipe(
    catchError((error: unknown) => {
      const message = getHttpErrorMessage(
        error,
        'Error de conexión con el servidor'
      );
      return throwError(() => new Error(message));
    })
  );
};
