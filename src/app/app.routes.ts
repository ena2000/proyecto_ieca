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

// Importación del Guard (cuando lo tengamos listo)
// import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Ruta inicial: redirige al Login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // --- Rutas Públicas ---
  { path: 'login', component: LoginComponent },

  // --- Rutas del Sistema (Front-End Web) ---
  { path: 'dashboard', component: DashboardComponent },
  { path: 'ministerios', component: MinisteriosComponent },
  { path: 'ingresos', component: IngresosComponent },
  { path: 'gastos', component: GastosComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'administracion', component: AdministracionComponent },

  // Ruta comodín: si escriben cualquier cosa mal, al login
  { path: '**', redirectTo: 'login' }
];