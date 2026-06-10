import { Component, HostListener } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SlidebarComponent } from './components/slidebar/slidebar.component';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarUiService } from './core/services/sidebar-ui.service';
import { addIcons } from 'ionicons';
import { 
  gridOutline, businessOutline, cashOutline, 
  trendingDownOutline, barChartOutline, peopleOutline, 
  logOutOutline, chevronDownOutline, menuOutline,
  settingsOutline, // <--- Agregamos este para Administración
  calendarOutline, // <--- Agregamos estos para que se vean en toda la app
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
export class AppComponent {
  public mostrarMenu = true;
  readonly mobileMenuOpen$ = this.sidebarUi.mobileOpen$;

  constructor(
    private router: Router,
    readonly sidebarUi: SidebarUiService
  ) {
    // 1. Registro de Iconos (Dentro del constructor)
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
      'settings-outline': settingsOutline, // Icono para Administración
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

 // 2. Lógica mejorada para detectar la ruta inicial y cambios
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.actualizarVisibilidadMenu(event.urlAfterRedirects || event.url);
    });
  }

  /** Rutas de autenticación: sin sidebar (solo contenido de la pantalla). */
  private readonly rutasSinMenu = ['/login', '/recuperar-password', '/cambiar-password'];

  private actualizarVisibilidadMenu(url: string) {
    const path = (url.split('?')[0] || '').toLowerCase();
    this.mostrarMenu = !this.rutasSinMenu.includes(path);
    if (!this.mostrarMenu) {
      this.sidebarUi.closeMobile();
    }
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
}