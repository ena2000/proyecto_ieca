import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/** Render free tier puede tardar ~60s en despertar; margen para subida con comprobante. */
export const API_MUTATION_TIMEOUT_MS = 120_000;

export const API_MUTATION_TIMEOUT_MESSAGE =
  'La operación tardó demasiado. Espera un momento e inténtalo de nuevo.';

export function withMutationTimeout<T>(source: Observable<T>): Observable<T> {
  return source.pipe(
    timeout({ each: API_MUTATION_TIMEOUT_MS }),
    catchError(err => {
      if (err instanceof TimeoutError) {
        return throwError(() => new Error(API_MUTATION_TIMEOUT_MESSAGE));
      }
      return throwError(() => err);
    })
  );
}
