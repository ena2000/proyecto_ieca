import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, 
  cashOutline, 
  documentTextOutline, 
  cloudUploadOutline, 
  saveOutline,
  notificationsOutline // Icono extra para el toolbar
} from 'ionicons/icons';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class IngresosComponent {
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
}