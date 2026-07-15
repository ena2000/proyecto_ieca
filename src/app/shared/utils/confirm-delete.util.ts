import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

/** True si el error HTTP indica que el recurso ya no existe. */
export function esHttp404(err: unknown): boolean {
  if (err instanceof HttpErrorResponse) {
    return err.status === 404;
  }
  if (err && typeof err === 'object' && 'status' in err) {
    return Number((err as { status: unknown }).status) === 404;
  }
  return false;
}

/**
 * Tras DELETE, confirma que GET /recurso/:id responde 404.
 * Si el registro sigue existiendo, falla (no dar éxito falso al front).
 */
export function confirmarEliminacionEnServidor(
  api: ApiService,
  resourcePath: string,
  id: number,
  mensajeSiSigueExiste =
    'El registro sigue en el servidor. No se pudo eliminar de forma permanente.'
): (source: Observable<unknown>) => Observable<void> {
  const path = `${resourcePath.replace(/\/$/, '')}/${id}`;
  return (source: Observable<unknown>) =>
    source.pipe(
      switchMap(() =>
        api.get<unknown>(path).pipe(
          map(() => {
            throw new Error(mensajeSiSigueExiste);
          }),
          catchError(err => {
            if (esHttp404(err)) {
              return of(undefined);
            }
            return throwError(() => err);
          })
        )
      )
    );
}
