import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonModal } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; // <--- IMPORTANTE: Agrega esto
import { addIcons } from 'ionicons';
import { 
  calendarOutline, 
  cashOutline, 
  documentTextOutline, 
  cloudUploadOutline, 
  saveOutline,
  notificationsOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: true,
  // Agrega FormsModule aquí abajo:
  imports: [IonicModule, CommonModule, FormsModule] 
})
export class IngresosComponent {
  // Inicializamos con la fecha de hoy
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

  // Esta función cierra el modal apenas tocas un día
  onFechaChange(event: any, modal: IonModal) {
    this.fechaSeleccionada = event.detail.value;
    modal.dismiss(); // Cierra el modal automáticamente
  }
}