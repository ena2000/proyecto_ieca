import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { puedeAccederRuta, rutaPorDefecto } from '../constants/roles.constants';

export const roleGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const path = state.url.split('?')[0];
  if (auth.puedeAccederRuta(path)) {
    return true;
  }

  return router.createUrlTree([auth.getRutaPorDefecto() || rutaPorDefecto(auth.getRol())]);
};
