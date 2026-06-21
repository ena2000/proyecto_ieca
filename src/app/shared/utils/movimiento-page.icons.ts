import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cashOutline,
  documentTextOutline,
  cloudUploadOutline,
  saveOutline,
  notificationsOutline,
  pencilOutline,
  trashOutline,
  closeCircleOutline,
  expandOutline,
  closeOutline,
  addCircleOutline,
  optionsOutline,
  checkmarkCircleOutline,
  personOutline,
  alertCircleOutline
} from 'ionicons/icons';

/** Iconos comunes en pantallas de ingresos y gastos. */
export function registerMovimientoPageIcons(): void {
  addIcons({
    'calendar-outline': calendarOutline,
    'cash-outline': cashOutline,
    'document-text-outline': documentTextOutline,
    'cloud-upload-outline': cloudUploadOutline,
    'save-outline': saveOutline,
    'notifications-outline': notificationsOutline,
    'pencil-outline': pencilOutline,
    'trash-outline': trashOutline,
    'close-circle-outline': closeCircleOutline,
    'expand-outline': expandOutline,
    'close-outline': closeOutline,
    'add-circle-outline': addCircleOutline,
    'options-outline': optionsOutline,
    'checkmark-circle-outline': checkmarkCircleOutline,
    'person-outline': personOutline,
    'alert-circle-outline': alertCircleOutline
  });
}
