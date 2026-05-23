import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  gridOutline, cashOutline, trendingDownOutline,
  barChartOutline, peopleOutline, settingsOutline, logOutOutline,
  chevronDownOutline, settingsSharp
} from 'ionicons/icons';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  color: 'dashboard' | 'ministerios' | 'ingresos' | 'gastos' | 'reportes' | 'usuarios' | 'admin';
}

@Component({
  selector: 'app-slidebar',
  templateUrl: './slidebar.component.html',
  styleUrls: ['./slidebar.component.scss'],
  standalone: true,
  imports: [IonIcon, RouterLink, RouterLinkActive],
  host: { class: 'ieca-sidebar-host' }
})
export class SlidebarComponent {

  readonly menuPrincipal: MenuItem[] = [
    { label: 'Dashboard',      route: '/dashboard',      icon: 'grid-outline',          color: 'dashboard'   },
    { label: 'Ministerios',    route: '/ministerios',    icon: 'business-outline',      color: 'ministerios' },
    { label: 'Ingresos',       route: '/ingresos',       icon: 'cash-outline',          color: 'ingresos',   badge: 3 },
    { label: 'Gastos',         route: '/gastos',         icon: 'trending-down-outline', color: 'gastos'      },
    { label: 'Reportes',       route: '/reportes',       icon: 'bar-chart-outline',     color: 'reportes'    },
  ];

  readonly menuSistema: MenuItem[] = [
    { label: 'Usuarios',       route: '/usuarios',       icon: 'people-outline',        color: 'usuarios'    },
    { label: 'Administración', route: '/administracion', icon: 'settings-outline',      color: 'admin'       },
  ];

  constructor() {
    addIcons({
      'grid-outline':          gridOutline,
      'cash-outline':          cashOutline,
      'trending-down-outline': trendingDownOutline,
      'bar-chart-outline':     barChartOutline,
      'people-outline':        peopleOutline,
      'settings-outline':      settingsOutline,
      'log-out-outline':       logOutOutline,
      'chevron-down-outline':  chevronDownOutline,
    });
  }
}