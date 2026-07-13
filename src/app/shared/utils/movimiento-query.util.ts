import { ActivatedRoute, Router } from '@angular/router';
import {
  FILTRO_ESTADO_MOVIMIENTO_TODOS,
  FiltroEstadoMovimiento
} from './movimiento-filtros.util';

export function leerFiltroPendientesDesdeRuta(param: string | null): boolean {
  return param === '1' || param === 'true';
}

/** Compatibilidad con enlaces `?pendientes=1` del dashboard o notificaciones. */
export function leerFiltroEstadoDesdeRuta(param: string | null): FiltroEstadoMovimiento {
  return leerFiltroPendientesDesdeRuta(param) ? 'pendiente' : FILTRO_ESTADO_MOVIMIENTO_TODOS;
}

export function limpiarQueryPendientes(route: ActivatedRoute, router: Router): void {
  if (!route.snapshot.queryParamMap.has('pendientes')) return;
  void router.navigate([], {
    relativeTo: route,
    queryParams: { pendientes: null },
    queryParamsHandling: 'merge',
    replaceUrl: true
  });
}

/** Quita `?id=` tras enfocar el registro desde una notificación. */
export function limpiarQueryIdRegistro(route: ActivatedRoute, router: Router): void {
  if (!route.snapshot.queryParamMap.has('id')) return;
  void router.navigate([], {
    relativeTo: route,
    queryParams: { id: null },
    queryParamsHandling: 'merge',
    replaceUrl: true
  });
}
