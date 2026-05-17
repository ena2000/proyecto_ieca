import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonDatetime, IonDatetimeButton, IonModal,
  IonInput, IonButton, IonSearchbar, IonThumbnail,
  ToastController, IonPopover 
} from '@ionic/angular/standalone';

import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline, cashOutline, documentTextOutline, cloudUploadOutline,
  saveOutline, notificationsOutline, searchOutline, filterOutline,
  pencilOutline, trashOutline, imageOutline, closeCircleOutline,
  funnelOutline, calendar, save
} from 'ionicons/icons';

import { TablaGeneralComponent } from 'src/app/components/tabla-general/tabla-general.component';

registerLocaleData(localeEs);

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonButtons,
    IonMenuButton, IonTitle, IonContent, IonIcon, IonItem, IonLabel,
    IonDatetime, IonDatetimeButton, IonModal, IonInput, IonButton,
    IonSearchbar, IonThumbnail, IonPopover, TablaGeneralComponent
  ],
  providers: [AlertController, ToastController] 
})
export class IngresosComponent implements OnInit {

  // --- VARIABLES PARA EL FORMULARIO (Sincronizadas con tu HTML) ---
  fechaManualForm: string = ''; // Antes era fechaManualRegistro

  // --- VARIABLES PARA FILTROS ---
  fechaManualDesde: string = '';
  fechaManualHasta: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroMontoMin: number | null = null;
  filtroMontoMax: number | null = null;
  searchTerm: string = '';

  // Modelo de Ingreso
  nuevoIngreso: any = {
    id: 0,
    fecha: new Date().toISOString(),
    descripcion: '',
    monto: null,
    foto: '',
    tipo: 'Diezmo',
    ministerio: 'Jóvenes'
  };

  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  contadorId = 0;
  listaIngresos: any[] = [];

  // Configuración de Tabla
  columnsIngresos = [
    { field: 'foto', header: 'Evidencia', type: 'image' },
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'tipo', header: 'Tipo', type: 'badge' },
    { field: 'ministerio', header: 'Ministerio' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'monto', header: 'Monto', type: 'currency' }
  ];

  acciones = { edit: true, delete: true };

  constructor(
    private alertController: AlertController,
    private toastController: ToastController 
  ) {
    addIcons({
      'calendar': calendar,
      'calendar-outline': calendarOutline,
      'cash-outline': cashOutline,
      'document-text-outline': documentTextOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'save': save,
      'save-outline': saveOutline,
      'notifications-outline': notificationsOutline,
      'search-outline': searchOutline,
      'filter-outline': filterOutline,
      'pencil-outline': pencilOutline,
      'trash-outline': trashOutline,
      'image-outline': imageOutline,
      'close-circle-outline': closeCircleOutline,
      'funnel-outline': funnelOutline 
    });
  }

  ngOnInit() {
    // Inicializar fecha del formulario
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    
    const data = localStorage.getItem('ingresos');
    if (data) {
      try {
        this.listaIngresos = JSON.parse(data);
        if (this.listaIngresos.length > 0) {
          const ids = this.listaIngresos.map(i => i.id || 0);
          this.contadorId = Math.max(...ids);
        }
      } catch (e) {
        this.listaIngresos = [];
      }
    }
  }

  // =========================================
  // LÓGICA DE FECHAS (MANUAL + PICKER)
  // =========================================

  private formatearISOaDDMMYYYY(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // Esta función sirve para los filtros (Desde/Hasta)
  validarFechaManual(event: any, tipo: 'desde' | 'hasta') {
    let val = event.target.value.replace(/\D/g, ''); 
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    
    if (tipo === 'desde') this.fechaManualDesde = val;
    else if (tipo === 'hasta') this.fechaManualHasta = val;

    if (val.length === 10) {
      const parts = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        const iso = dateObj.toISOString();
        if (tipo === 'desde') this.filtroFechaInicio = iso;
        else if (tipo === 'hasta') this.filtroFechaFin = iso;
      }
    }
  }

  // Esta función es específica para el FORMULARIO (Evita el error en el template)
  validarFechaManualForm(event: any) {
    let val = event.target.value.replace(/\D/g, ''); 
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    
    this.fechaManualForm = val;

    if (val.length === 10) {
      const parts = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        this.nuevoIngreso.fecha = dateObj.toISOString();
      }
    }
  }

  // Para los Pickers de los FILTROS
  onPickerDateChange(event: any, tipo: 'desde' | 'hasta') {
    const fechaIso = event.detail.value;
    const formateada = this.formatearISOaDDMMYYYY(fechaIso);

    if (tipo === 'desde') {
      this.filtroFechaInicio = fechaIso;
      this.fechaManualDesde = formateada;
    } else if (tipo === 'hasta') {
      this.filtroFechaFin = fechaIso;
      this.fechaManualHasta = formateada;
    }
  }

  // Para el Picker del FORMULARIO (Evita el error en el template)
  onFechaPickerChange(event: any) {
    const fechaIso = event.detail.value;
    this.nuevoIngreso.fecha = fechaIso;
    this.fechaManualForm = this.formatearISOaDDMMYYYY(fechaIso);
  }

  // Mantenemos por compatibilidad con popovers antiguos si existen
  onFechaChange(event: any, popover: any) {
    if (event.detail.value) {
      this.nuevoIngreso.fecha = event.detail.value;
      this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    }
    popover.dismiss();
  }

  // =========================================
  // GESTIÓN DE DATOS
  // =========================================

  get listaFiltrada() {
    let filtrados = [...this.listaIngresos];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(i => 
        i.descripcion?.toLowerCase().includes(search) || 
        i.tipo?.toLowerCase().includes(search)
      );
    }

    if (this.filtroFechaInicio) {
      const inicio = new Date(this.filtroFechaInicio).setHours(0,0,0,0);
      filtrados = filtrados.filter(i => new Date(i.fecha).setHours(0,0,0,0) >= inicio);
    }
    if (this.filtroFechaFin) {
      const fin = new Date(this.filtroFechaFin).setHours(0,0,0,0);
      filtrados = filtrados.filter(i => new Date(i.fecha).setHours(0,0,0,0) <= fin);
    }

    if (this.filtroMontoMin !== null) {
      filtrados = filtrados.filter(i => i.monto >= (this.filtroMontoMin || 0));
    }
    if (this.filtroMontoMax !== null) {
      filtrados = filtrados.filter(i => i.monto <= (this.filtroMontoMax || Infinity));
    }

    return filtrados;
  }

  registrarIngreso() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast('Por favor, revisa los campos marcados en rojo', 'danger');
      return;
    }

    const fechaFormateada = this.fechaManualForm;

    if (this.modoEdicion) {
      const index = this.listaIngresos.findIndex(i => i.id === this.idEditando);
      if (index !== -1) {
        this.listaIngresos[index] = { ...this.nuevoIngreso, fechaFormateada };
        this.mostrarToast('Ingreso actualizado con éxito', 'success');
      }
    } else {
      this.contadorId++;
      const nuevoRegistro = { ...this.nuevoIngreso, id: this.contadorId, fechaFormateada };
      this.listaIngresos = [nuevoRegistro, ...this.listaIngresos];
      this.mostrarToast('Ingreso registrado con éxito', 'success');
    }

    this.guardarLocalStorage();
    this.resetFormulario();
  }

  editarIngreso(item: any) {
    this.nuevoIngreso = { ...item };
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    this.modoEdicion = true;
    this.idEditando = item.id;
    this.intentoEnvio = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async eliminarIngreso(item: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el registro "${item.descripcion}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.listaIngresos = this.listaIngresos.filter(i => i.id !== item.id);
            this.guardarLocalStorage();
            this.mostrarToast('Registro eliminado', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  resetFormulario() {
    this.nuevoIngreso = {
      id: 0, fecha: new Date().toISOString(), descripcion: '',
      monto: null, foto: '', tipo: 'Diezmo', ministerio: 'Jóvenes'
    };
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    this.modoEdicion = false;
    this.idEditando = null;
    this.intentoEnvio = false;
  }

  // =========================================
  // UTILS Y MEDIA
  // =========================================

  guardarLocalStorage() {
    localStorage.setItem('ingresos', JSON.stringify(this.listaIngresos));
  }

  async mostrarToast(mensaje: string, color: string) {
    // CORRECCIÓN: Se eliminó .controller, se usa directo this.toastController
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        this.nuevoIngreso.foto = canvas.toDataURL('image/jpeg', 0.7);
      };
    };
    reader.readAsDataURL(file);
  }

  eliminarFoto() {
    this.nuevoIngreso.foto = '';
  }

  get esFormularioValido(): boolean {
    return (
      this.nuevoIngreso.descripcion?.trim().length >= 3 &&
      this.nuevoIngreso.monto !== null &&
      this.nuevoIngreso.monto > 0 &&
      this.fechaManualForm.length === 10
    );
  }
}