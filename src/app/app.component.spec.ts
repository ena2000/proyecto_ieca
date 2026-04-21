import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router'; 
import { filter } from 'rxjs/operators';

// Importaciones de Ionic Standalone
import { 
  IonApp, 
  IonRouterOutlet, 
  IonSplitPane, 
  IonIcon, 
  IonLabel, 
  IonItem, 
  IonList, 
  IonMenu 
} from '@ionic/angular/standalone';

// Importación de tu componente de menú
import { SlidebarComponent } from './components/slidebar/slidebar.component';

// Iconos
import { addIcons } from 'ionicons';
import { 
  gridOutline, 
  businessOutline, 
  cashOutline, 
  trendingDownOutline, 
  barChartOutline, 
  peopleOutline, 
  logOutOutline, 
  chevronDownOutline, 
  menuOutline,
  chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonApp, 
    IonRouterOutlet, 
    IonSplitPane,
    IonIcon,
    IonLabel,
    IonItem,
    IonList,
    IonMenu,
    SlidebarComponent, 
    CommonModule
  ],
})
export class AppComponent {
  // Esta variable controla si el menú se dibuja o no
  public mostrarMenu = true;

  constructor(private router: Router) {
    // 1. Lógica para detectar la ruta actual
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      
      // Si la URL contiene 'login', la variable es false, de lo contrario es true
      // Esto hace que el menú desaparezca automáticamente al ir al login
      this.mostrarMenu = !url.toLowerCase().includes('login');
    });

    // 2. Registro global de iconos (para que funcionen en toda la app)
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
      'chevron-forward-outline': chevronForwardOutline
    });
  }
}