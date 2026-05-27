import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { puedeAccederRuta, rutaPorDefecto } from '../constants/roles.constants';

export const roleGuard: CanActivateFn = async (_route, state) => {
  const auth      = inject(AuthService);
  const router    = inject(Router);
  const toastCtrl = inject(ToastController);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const path = state.url.split('?')[0];

  // Forzar cambio de contraseña antes de entrar a cualquier sección
  if (auth.getSession()?.mustChangePassword && path !== '/cambiar-password') {
    return router.createUrlTree(['/cambiar-password']);
  }

  // Siempre permitir acceder a la pantalla de cambio de contraseña
  if (path === '/cambiar-password') {
    return true;
  }

  if (auth.puedeAccederRuta(path)) {
    return true;
  }

  const toast = await toastCtrl.create({
    message:  'No tienes permiso para acceder a esta sección.',
    duration: 3200,
    color:    'warning',
    position: 'top'
  });
  await toast.present();

  return router.createUrlTree([
    auth.getRutaPorDefecto() || rutaPorDefecto(auth.getRol())
  ]);
};
