import { Routes } from '@angular/router';

// Importación de tus componentes
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MinisteriosComponent } from './pages/ministerios/ministerios.component';
import { IngresosComponent } from './pages/ingresos/ingresos.component';
import { GastosComponent } from './pages/gastos/gastos.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { AdministracionComponent } from './pages/administracion/administracion.component';
import { CambiarPasswordComponent } from './auth/cambiar-password/cambiar-password.component';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'cambiar-password', component: CambiarPasswordComponent, canActivate: [authGuard, roleGuard] },

  { path: 'dashboard',      component: DashboardComponent,      canActivate: [authGuard, roleGuard] },
  { path: 'ministerios',    component: MinisteriosComponent,    canActivate: [authGuard, roleGuard] },
  { path: 'ingresos',       component: IngresosComponent,       canActivate: [authGuard, roleGuard] },
  { path: 'gastos',         component: GastosComponent,         canActivate: [authGuard, roleGuard] },
  { path: 'reportes',       component: ReportesComponent,       canActivate: [authGuard, roleGuard] },
  { path: 'usuarios',       component: UsuariosComponent,       canActivate: [authGuard, roleGuard] },
  { path: 'administracion', component: AdministracionComponent, canActivate: [authGuard, roleGuard] },

  // Ruta comodín: si escriben cualquier cosa mal, al login
  { path: '**', redirectTo: 'login' }
];