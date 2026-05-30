import { ActivatedRoute, Router } from '@angular/router';

export function leerFiltroPendientesDesdeRuta(param: string | null): boolean {
  return param === '1' || param === 'true';
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
