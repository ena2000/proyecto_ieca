import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonMenuButton, 
  IonTitle, IonContent, IonGrid, IonRow, IonCol, 
  IonCard, IonCardContent, IonIcon, IonButton, 
  IonList, IonItem, IonLabel, IonBadge 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonButtons, IonMenuButton, 
    IonTitle, IonContent, IonGrid, IonRow, IonCol, 
    IonCard, IonCardContent, IonIcon, IonButton, 
    IonList, IonItem, IonLabel, IonBadge
  ]
})
export class DashboardComponent {
  // Datos de prueba para la lista
  recientes = [
    { tipo: 'ingreso', titulo: 'Diezmos Dominicales', monto: 520.00, fecha: 'Hoy', icon: 'cash-outline' },
    { tipo: 'gasto', titulo: 'Mantenimiento Equipos', monto: 45.00, fecha: 'Ayer', icon: 'trending-down-outline' },
    { tipo: 'ingreso', titulo: 'Ofrendas Pro-Templo', monto: 150.00, fecha: '12 May', icon: 'cash-outline' }
  ];
}
