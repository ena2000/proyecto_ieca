import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonSplitPane } from '@ionic/angular/standalone';
import { SlidebarComponent } from './components/slidebar/slidebar.component';
import { CommonModule } from '@angular/common'; 
import { Router, NavigationEnd } from '@angular/router'; 
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  gridOutline, businessOutline, cashOutline, 
  trendingDownOutline, barChartOutline, peopleOutline, 
  logOutOutline, chevronDownOutline, menuOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp, 
    IonRouterOutlet, 
    IonSplitPane,      // <--- ¡Asegúrate de importar esto!
    SlidebarComponent, 
    CommonModule
  ],
})
export class AppComponent {
  public mostrarMenu = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Si la URL contiene 'login', ocultamos el menú
      const url = event.urlAfterRedirects || event.url;
      this.mostrarMenu = !url.toLowerCase().includes('login');
    });
  }
}

    // Registra los iconos una sola vez aquí para toda la app
    addIcons({ 
      'grid-outline': gridOutline,
      'business-outline': businessOutline,
      'cash-outline': cashOutline,
      'trending-down-outline': trendingDownOutline,
      'bar-chart-outline': barChartOutline,
      'people-outline': peopleOutline,
      'log-out-outline': logOutOutline,
      'chevron-down-outline': chevronDownOutline,
      'menu-outline': menuOutline
    });