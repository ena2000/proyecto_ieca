import { Component, HostBinding, HostListener, OnDestroy, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
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
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { SidebarUiService } from '../../core/services/sidebar-ui.service';

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

  @HostBinding('class.mobile-drawer-open')
  mobileDrawerOpen = false;

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

  private ingresosNoLeidas = 0;
  private gastosNoLeidas   = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly notificacionesService: NotificacionesService,
    private readonly sidebarUi: SidebarUiService
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

  get nombreUsuario(): string {
    return this.authService.getSession()?.usuario?.trim() || '';
  }

  get rolUsuario(): string {
    return this.authService.getSession()?.rol?.trim() || '';
  }

  get inicialesUsuario(): string {
    const base = this.nombreUsuario || '?';
    return base.charAt(0).toUpperCase();
  }

  get tituloUsuarioColapsado(): string {
    if (!this.nombreUsuario) return 'Sesión';
    return this.rolUsuario
      ? `${this.nombreUsuario} · ${this.rolUsuario}`
      : this.nombreUsuario;
  }

  ngOnInit() {
    this.actualizarMenusPorRol();

    this.sidebarUi.mobileOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(open => {
        this.mobileDrawerOpen = open;
      });

    combineLatest([
      this.notificacionesService.lista$,
      this.authService.session$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const uid = this.authService.getSession()?.id ?? '';
        const rol = this.authService.getRol();
        const ministerioId = this.authService.getMinisterioScopeId();
        this.ingresosNoLeidas = this.notificacionesService.getNoLeidasCountPorTipo(
          uid, 'ingreso', rol, ministerioId
        );
        this.gastosNoLeidas = this.notificacionesService.getNoLeidasCountPorTipo(
          uid, 'gasto', rol, ministerioId
        );
        this.actualizarMenusPorRol();
      });
  }

  private actualizarMenusPorRol(): void {
    const puede = (ruta: string) => this.authService.puedeAccederRuta(ruta);
    this.menuPrincipal = this.menuPrincipalBase.filter(item => puede(item.route));
    this.menuSistema   = this.menuSistemaBase.filter(item => puede(item.route));
    this.actualizarBadgesFinanzas();
  }

  /** Badges de notificaciones no leídas (admin, contable y líder). */
  private debeMostrarBadgesFinanzas(): boolean {
    return (
      this.authService.isAdministrador() ||
      this.authService.isContable() ||
      this.authService.isLider()
    );
  }

  private actualizarBadgesFinanzas(): void {
    const mostrar = this.debeMostrarBadgesFinanzas();

    this.menuPrincipal = this.menuPrincipal.map(item => {
      if (item.route === '/ingresos') {
        const badge = mostrar && this.ingresosNoLeidas > 0 ? this.ingresosNoLeidas : undefined;
        return { ...item, badge };
      }
      if (item.route === '/gastos') {
        const badge = mostrar && this.gastosNoLeidas > 0 ? this.gastosNoLeidas : undefined;
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

  navigateTo(event: Event, route: string): void {
    event.preventDefault();
    if (this.isRouteActive(route)) {
      return;
    }
    this.sidebarUi.closeMobile();
    void this.router.navigateByUrl(route);
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  onSidebarEnter(): void {
    if (this.sidebarUi.isMobileViewport()) return;
    this.isOpen = true;
  }

  onSidebarLeave(): void {
    if (this.sidebarUi.isMobileViewport()) return;
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
    if (event.key !== 'Escape') return;
    if (this.sidebarUi.isMobileViewport() && this.mobileDrawerOpen) {
      this.sidebarUi.closeMobile();
      return;
    }
    if (this.isOpen && !this.isPinned) {
      this.isOpen = false;
    }
  }
}
