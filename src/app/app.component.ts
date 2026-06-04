import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SlidebarComponent } from './components/slidebar/slidebar.component';
import { CommonModule } from '@angular/common'; 
import { Router, NavigationEnd } from '@angular/router'; 
import { filter } from 'rxjs/operators';
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

  constructor(private router: Router) {
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

  private actualizarVisibilidadMenu(url: string) {
    // Esto asegura que si estás en /login o /login?retry=true funcione
    this.mostrarMenu = !url.toLowerCase().includes('login');
  }
}