import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { CambiarPasswordComponent } from './auth/cambiar-password/cambiar-password.component';
import { RecuperarPasswordComponent } from './auth/recuperar-password/recuperar-password.component';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'recuperar-password', component: RecuperarPasswordComponent },
  { path: 'cambiar-password', component: CambiarPasswordComponent, canActivate: [authGuard, roleGuard] },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'ministerios',
    loadComponent: () =>
      import('./pages/ministerios/ministerios.component').then(m => m.MinisteriosComponent),
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'ingresos',
    loadComponent: () =>
      import('./pages/ingresos/ingresos.component').then(m => m.IngresosComponent),
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'gastos',
    loadComponent: () =>
      import('./pages/gastos/gastos.component').then(m => m.GastosComponent),
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('./pages/reportes/reportes.component').then(m => m.ReportesComponent),
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'administracion',
    loadComponent: () =>
      import('./pages/administracion/administracion.component').then(m => m.AdministracionComponent),
    canActivate: [authGuard, roleGuard]
  },

  { path: '**', redirectTo: 'login' }
];
