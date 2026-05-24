import { Component, HostBinding, HostListener, OnDestroy, OnInit } from '@angular/core';
import { IonIcon, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  gridOutline, cashOutline, trendingDownOutline,
  barChartOutline, peopleOutline, settingsOutline, logOutOutline,
  chevronForwardOutline, chevronBackOutline, businessOutline
} from 'ionicons/icons';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { IngresosService } from '../../services/ingresos.service';
import { GastosService } from '../../services/gastos.service';

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
  imports: [IonIcon],
  host: { class: 'ieca-sidebar-host' }
})
export class SlidebarComponent implements OnInit, OnDestroy {
  isOpen = false;
  isPinned = false;

  @HostBinding('class.sidebar-open')
  get sidebarOpen(): boolean {
    return this.isOpen || this.isPinned;
  }

  private readonly menuPrincipalBase: MenuItem[] = [
    { label: 'Dashboard',   route: '/dashboard',   icon: 'grid-outline',          color: 'dashboard'   },
    { label: 'Ministerios', route: '/ministerios', icon: 'business-outline',      color: 'ministerios' },
    { label: 'Ingresos',    route: '/ingresos',    icon: 'cash-outline',          color: 'ingresos'    },
    { label: 'Gastos',      route: '/gastos',      icon: 'trending-down-outline', color: 'gastos'      },
    { label: 'Reportes',    route: '/reportes',    icon: 'bar-chart-outline',     color: 'reportes'    },
  ];

  private readonly menuSistemaBase: MenuItem[] = [
    { label: 'Usuarios',       route: '/usuarios',       icon: 'people-outline',   color: 'usuarios' },
    { label: 'Administración', route: '/administracion', icon: 'settings-outline', color: 'admin'    },
  ];

  menuPrincipal: MenuItem[] = [];
  menuSistema: MenuItem[] = [];

  private ingresosCount = 0;
  private gastosCount   = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly navCtrl: NavController,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly ingresosService: IngresosService,
    private readonly gastosService: GastosService
  ) {
    addIcons({
      'grid-outline': gridOutline,
      'business-outline': businessOutline,
      'cash-outline': cashOutline,
      'trending-down-outline': trendingDownOutline,
      'bar-chart-outline': barChartOutline,
      'people-outline': peopleOutline,
      'settings-outline': settingsOutline,
      'log-out-outline': logOutOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'chevron-back-outline': chevronBackOutline,
    });
  }

  ngOnInit() {
    this.actualizarMenusPorRol();

    combineLatest([
      this.ingresosService.ingresos$,
      this.gastosService.gastos$,
      this.authService.session$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([ingresos, gastos]) => {
        this.ingresosCount = ingresos.length;
        this.gastosCount   = gastos.length;
        this.actualizarMenusPorRol();
      });
  }

  private actualizarMenusPorRol(): void {
    const puede = (ruta: string) => this.authService.puedeAccederRuta(ruta);
    this.menuPrincipal = this.menuPrincipalBase.filter(item => puede(item.route));
    this.menuSistema   = this.menuSistemaBase.filter(item => puede(item.route));
    this.actualizarBadgesFinanzas();
  }

  /** Contador en menú solo para administrador y contable (no líder/co-líder). */
  private debeMostrarBadgesFinanzas(): boolean {
    return this.authService.isAdministrador() || this.authService.isContable();
  }

  private actualizarBadgesFinanzas(): void {
    const mostrar = this.debeMostrarBadgesFinanzas();

    this.menuPrincipal = this.menuPrincipal.map(item => {
      if (item.route === '/ingresos') {
        const badge = mostrar && this.ingresosCount > 0 ? this.ingresosCount : undefined;
        return { ...item, badge };
      }
      if (item.route === '/gastos') {
        const badge = mostrar && this.gastosCount > 0 ? this.gastosCount : undefined;
        return { ...item, badge };
      }
      return { ...item, badge: undefined };
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isRouteActive(route: string): boolean {
    const path = this.router.url.split('?')[0];
    return path === route || path.startsWith(`${route}/`);
  }

  async navigateTo(event: Event, route: string): Promise<void> {
    event.preventDefault();
    if (this.isRouteActive(route)) {
      return;
    }
    await this.navCtrl.navigateRoot(route, { animated: false });
  }

  async logout(event: Event): Promise<void> {
    event.preventDefault();
    this.authService.logout();
    await this.navCtrl.navigateRoot('/login', { animated: false });
  }

  onSidebarEnter(): void {
    this.isOpen = true;
  }

  onSidebarLeave(): void {
    if (!this.isPinned) {
      this.isOpen = false;
    }
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
    this.isOpen = this.isPinned;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen && !this.isPinned) {
      this.isOpen = false;
    }
  }
}
