import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importamos los componentes específicos para asegurar compatibilidad
import { 
  IonHeader, IonToolbar, IonButtons, IonMenuButton, 
  IonTitle, IonContent, IonIcon, IonItem, IonLabel, 
  IonDatetime, IonDatetimeButton, IonModal, IonInput, IonButton, IonNote
} from '@ionic/angular/standalone'; 
import { addIcons } from 'ionicons';
import { 
  calendarOutline, cashOutline, documentTextOutline, 
  cloudUploadOutline, saveOutline, notificationsOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    // Listamos los componentes de Ionic aquí:
    IonHeader, IonToolbar, IonButtons, IonMenuButton, 
    IonTitle, IonContent, IonIcon, IonItem, IonLabel, 
    IonDatetime, IonDatetimeButton, IonModal, IonInput, IonButton, IonNote
  ] 
})
export class IngresosComponent {
  fechaSeleccionada: string = new Date().toISOString();

  constructor() {
    addIcons({ 
      'calendar-outline': calendarOutline,
      'cash-outline': cashOutline,
      'document-text-outline': documentTextOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'save-outline': saveOutline,
      'notifications-outline': notificationsOutline
    });
  }

  onFechaChange(event: any, modal: any) {
    this.fechaSeleccionada = event.detail.value;
    modal.dismiss();
  }
}