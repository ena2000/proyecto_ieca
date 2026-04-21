import { Component } from '@angular/core';
import { 
  IonList, IonItem, IonIcon, IonLabel, 
  IonMenu, IonContent 
} from '@ionic/angular/standalone';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-slidebar',
  templateUrl: './slidebar.component.html',
  styleUrls: ['./slidebar.component.scss'],
  standalone: true,
  imports: [
    IonList, IonItem, IonIcon, IonLabel, 
    IonMenu, IonContent, // <-- ¡IMPORTANTES!
    RouterLink, RouterLinkActive
  ]
})
export class SlidebarComponent {}