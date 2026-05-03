import { Component } from '@angular/core';
import { 
  IonList, IonItem, IonIcon, IonLabel, 
  IonMenu, IonContent, IonMenuToggle, // <-- Agregar IonMenuToggle
  IonAvatar, IonRouterLink // Por si lo usas en el perfil
} from '@ionic/angular/standalone';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-slidebar',
  templateUrl: './slidebar.component.html',
  styleUrls: ['./slidebar.component.scss'],
  standalone: true,
  imports: [
    IonList, IonItem, IonIcon, IonLabel, 
    IonMenu, IonContent, IonMenuToggle, // <-- Incluirlo aquí
    RouterLink, RouterLinkActive, IonRouterLink, IonAvatar // Por si lo usas en el perfil
  ]
})
export class SlidebarComponent {}