import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton,
  IonTitle, IonContent, IonIcon, IonItem, IonLabel,
  IonDatetime, IonDatetimeButton, IonModal, IonInput,
  IonButton, IonSearchbar
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  calendarOutline, cashOutline, documentTextOutline,
  cloudUploadOutline, saveOutline, notificationsOutline,
  searchOutline, filterOutline, pencilOutline, trashOutline
} from 'ionicons/icons';

import { TablaGeneralComponent } from 'src/app/components/tabla-general/tabla-general.component';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonInput,
    IonButton,
    IonSearchbar,
    TablaGeneralComponent
  ]
})
export class IngresosComponent {

  // =========================
  // 📅 FECHA
  // =========================
  fechaSeleccionada: string = new Date().toISOString();

  constructor() {
    addIcons({
      'calendar-outline': calendarOutline,
      'cash-outline': cashOutline,
      'document-text-outline': documentTextOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'save-outline': saveOutline,
      'notifications-outline': notificationsOutline,
      'search-outline': searchOutline,
      'filter-outline': filterOutline,
      'pencil-outline': pencilOutline,
      'trash-outline': trashOutline
    });
  }

  // =========================
  // 🧠 MODELO FORMULARIO
  // =========================
  nuevoIngreso: any = {
    id: 0,
    fecha: '',
    descripcion: '',
    monto: 0,
    foto: '',
    tipo: 'Diezmo',
    ministerio: 'Jóvenes'
  };

  listaIngresos: any[] = [];

  modoEdicion = false;
  idEditando: number | null = null;

  contadorId = 0;

  // =========================
  // 📊 TABLA
  // =========================
  columnsIngresos = [
    { field: 'fecha', header: 'Fecha' },
    { field: 'tipo', header: 'Tipo', type: 'badge' },
    { field: 'ministerio', header: 'Ministerio' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'monto', header: 'Monto', type: 'currency' }
  ];

  acciones = {
    edit: true,
    delete: true
  };

  // =========================
  // 📅 FECHA
  // =========================
  onFechaChange(event: any, modal: any) {
    this.nuevoIngreso.fecha = event.detail.value;
    modal.dismiss();
  }

  // =========================
  // 🖼️ FOTO (BASE64)
  // =========================
  onFileChange(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      this.nuevoIngreso.foto = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  // =========================
  // ➕ CREAR / EDITAR
  // =========================
  registrarIngreso() {

    if (this.modoEdicion) {

      const index = this.listaIngresos.findIndex(i => i.id === this.idEditando);

      if (index !== -1) {
        this.listaIngresos[index] = { ...this.nuevoIngreso };
      }

      this.modoEdicion = false;
      this.idEditando = null;

    } else {

      this.contadorId++;

      const nuevo = {
        ...this.nuevoIngreso,
        id: this.contadorId
      };

      this.listaIngresos = [...this.listaIngresos, nuevo];
    }

    this.resetFormulario();
  }

  // =========================
  // ✏️ EDITAR
  // =========================
  editarIngreso(item: any) {
    this.nuevoIngreso = { ...item };
    this.modoEdicion = true;
    this.idEditando = item.id;
  }

  // =========================
  // 🗑️ ELIMINAR
  // =========================
  eliminarIngreso(item: any) {
    this.listaIngresos = this.listaIngresos.filter(i => i.id !== item.id);
  }

  // =========================
  // 🧹 RESET
  // =========================
  resetFormulario() {
    this.nuevoIngreso = {
      id: 0,
      fecha: '',
      descripcion: '',
      monto: 0,
      foto: '',
      tipo: 'Diezmo',
      ministerio: 'Jóvenes'
    };
  }
}