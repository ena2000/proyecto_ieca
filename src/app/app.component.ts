import { Component, HostListener, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SlidebarComponent } from './components/slidebar/slidebar.component';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarUiService } from './core/services/sidebar-ui.service';
import { AuthService } from './core/services/auth.service';
import { despertarApiEnSegundoPlano } from './shared/utils/api-wake.util';
import { environment } from '../environments/environment';
import { addIcons } from 'ionicons';
import {
  gridOutline, businessOutline, cashOutline,
  trendingDownOutline, barChartOutline, peopleOutline,
  logOutOutline, chevronDownOutline, menuOutline,
  settingsOutline,
  calendarOutline,
  documentTextOutline,
  cloudUploadOutline,
  saveOutline,
  notificationsOutline,
  eyeOutline,
  eyeOffOutline,
  arrowForwardCircle,
  arrowForwardOutline,
  mailOutline,
  checkmarkCircle,
  informationCircle,
  warning,
  shield
} from 'ionicons/icons';

const CHUNK_RELOAD_KEY = 'ieca_chunk_reload';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp,
    IonRouterOutlet,
    SlidebarComponent,
    CommonModule
  ],
})
export class AppComponent implements OnInit {
  public mostrarMenu = true;
  readonly mobileMenuOpen$ = this.sidebarUi.mobileOpen$;

  constructor(
    private router: Router,
    private auth: AuthService,
    readonly sidebarUi: SidebarUiService
  ) {
    addIcons({
      'grid-outline': gridOutline,
      'business-outline': businessOutline,
      'cash-outline': cashOutline,
      'trending-down-outline': trendingDownOutline,
      'bar-chart-outline': barChartOutline,
      'people-outline': peopleOutline,
      'log-out-outline': logOutOutline,
      'chevron-down-outline': chevronDownOutline,
      'menu-outline': menuOutline,
      'settings-outline': settingsOutline,
      'calendar-outline': calendarOutline,
      'document-text-outline': documentTextOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'save-outline': saveOutline,
      'notifications-outline': notificationsOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'arrow-forward-circle': arrowForwardCircle,
      'arrow-forward-outline': arrowForwardOutline,
      'mail-outline': mailOutline,
      'checkmark-circle': checkmarkCircle,
      'information-circle': informationCircle,
      warning,
      shield
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.actualizarVisibilidadMenu(event.urlAfterRedirects || event.url);
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        /* ignore */
      }
    });

    // Tras un deploy, un chunk viejo puede fallar al abrir Administración u otra página.
    this.router.events.pipe(
      filter((event): event is NavigationError => event instanceof NavigationError)
    ).subscribe(event => {
      this.recuperarNavegacionFallida(event);
    });
  }

  ngOnInit(): void {
    if (environment.production && !environment.useLocalFallback) {
      despertarApiEnSegundoPlano();
    }
    void this.auth.refreshAccessToken();
  }

  private readonly rutasSinMenu = ['/login', '/recuperar-password', '/cambiar-password'];

  private actualizarVisibilidadMenu(url: string) {
    const path = (url.split('?')[0] || '').toLowerCase();
    this.mostrarMenu = !this.rutasSinMenu.includes(path);
    if (!this.mostrarMenu) {
      this.sidebarUi.closeMobile();
    }
  }

  private recuperarNavegacionFallida(event: NavigationError): void {
    const msg = String(event.error?.message ?? event.error ?? '');
    const esChunk =
      /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
        msg
      );
    if (!esChunk) return;

    let already = false;
    try {
      already = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
    } catch {
      already = false;
    }
    if (already) return;

    try {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    } catch {
      /* ignore */
    }
    const target = event.url || '/dashboard';
    window.location.assign(target.startsWith('/') ? target : `/${target}`);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.mostrarMenu || !this.sidebarUi.isMobileViewport()) return;
    const path = event.composedPath?.() as EventTarget[] | undefined;
    const menuBtn = path?.find(
      node => node instanceof HTMLElement && node.tagName === 'ION-MENU-BUTTON'
    );
    if (!menuBtn) return;
    event.preventDefault();
    event.stopPropagation();
    this.sidebarUi.toggleMobile();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.sidebarUi.isMobileViewport()) {
      this.sidebarUi.closeMobile();
    }
  }

  /** Renueva el access token al volver a la pestaña (evita “token inválido” tras idle). */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState !== 'visible') return;
    if (!this.auth.isAuthenticated()) return;
    void this.auth.refreshAccessToken();
  }
}
