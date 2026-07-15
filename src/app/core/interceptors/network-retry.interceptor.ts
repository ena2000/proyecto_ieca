import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { esperarApiDisponible } from '../../shared/utils/api-wake.util';

const RETRY_HEADER = 'X-Ieca-Network-Retry';

/**
 * Si la API no responde (status 0 o CORS «null» en Firefox), reintenta una vez
 * tras ping a /health. Con plan Starter el servicio no duerme; el reintento cubre
 * caídas puntuales o deploys.
 */
export const networkRetryInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.production || environment.useLocalFallback || req.headers.has(RETRY_HEADER)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 0) {
        return throwError(() => error);
      }

      return from(esperarApiDisponible(20_000)).pipe(
        switchMap(ok => {
          if (!ok) {
            return throwError(() => error);
          }
          const retryReq = req.clone({ setHeaders: { [RETRY_HEADER]: '1' } });
          return next(retryReq);
        })
      );
    })
  );
};
