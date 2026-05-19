import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonDatetime, IonInput, IonButton, 
  IonSearchbar, ToastController, IonPopover, IonBadge, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline, documentTextOutline, cloudUploadOutline,
  saveOutline, notificationsOutline, pencilOutline, trashOutline, 
  closeCircleOutline, expandOutline, closeOutline, addCircleOutline, optionsOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';

registerLocaleData(localeEs);

interface Ministerio {
  id: number;
  fecha: string;
  nombre: string;
  descripcion: string;
  responsable: string;
  foto: string;
  estado: string;
  fechaFormateada?: string;
}

@Component({
  selector: 'app-ministerios',
  templateUrl: './ministerios.component.html',
  styleUrls: ['./ministerios.component.scss'],
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
    IonInput,
    IonButton,
    IonSearchbar,
    IonPopover,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonSelectOption,
    IonSelect,
    TablaGeneralComponent
  ],
  providers: [AlertController, ToastController]
})
export class MinisteriosComponent implements OnInit {

  fechaManualForm: string = '';
  
  nuevoMinisterio: Ministerio = {
    id: 0,
    fecha: new Date().toISOString(),
    nombre: '',
    descripcion: '',
    responsable: '',
    foto: '',
    estado: 'Activo'
  };

  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  contadorId = 0;
  listaMinisterios: Ministerio[] = [];

  searchTerm: string = '';
  fechaManualDesde: string = '';
  fechaManualHasta: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  fotoSeleccionada: string | null = null;

  columnsMinisterios: TableColumn[] = [
    { field: 'foto', header: 'Logo', type: 'image' },
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'responsable', header: 'Responsable' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'estado', header: 'Estado', type: 'badge' }
  ];

  acciones = {
    edit: true,
    delete: true
  };

  estadosMinisterio: string[] = ['Activo', 'Pausado', 'Inactivo'];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      'calendar-outline': calendarOutline,
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
      'options-outline': optionsOutline
    });
  }

  ngOnInit() {
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoMinisterio.fecha);
    this.cargarDatos();
  }
  
  @HostListener('document:keydown.escape', [])
  handleEscapeKey() {
    if (this.fotoSeleccionada) {
      this.cerrarImagen();
    }
  }

  verImagen(foto: any) {
    if (foto && typeof foto === 'string') {
      this.fotoSeleccionada = foto;
      document.body.style.overflow = 'hidden';
    }
  }

  cerrarImagen() {
    this.fotoSeleccionada = null;
    document.body.style.overflow = 'auto';
  }

  private formatearISOaDDMMYYYY(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  validarFechaManualForm(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    this.fechaManualForm = val;

    if (val.length === 10) {
      const parts = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        this.nuevoMinisterio.fecha = dateObj.toISOString();
      }
    }
  }

  onFechaPickerChange(event: any, popover: IonPopover) {
    const fechaIso = event.detail.value;
    if (fechaIso) {
      this.nuevoMinisterio.fecha = fechaIso;
      this.fechaManualForm = this.formatearISOaDDMMYYYY(fechaIso);
      popover.dismiss();
    }
  }

  validarFechaManual(event: any, tipo: 'desde' | 'hasta') {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    
    if (tipo === 'desde') {
      this.fechaManualDesde = val;
    } else if (tipo === 'hasta') {
      this.fechaManualHasta = val;
    }

    if (val.length === 10) {
      const parts = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        const iso = dateObj.toISOString();
        if (tipo === 'desde') {
          this.filtroFechaInicio = iso;
        } else {
          this.filtroFechaFin = iso;
        }
      }
    }
  }

  onPickerDateChange(event: any, tipo: 'desde' | 'hasta', popover: IonPopover) {
    const fechaIso = event.detail.value;
    if (fechaIso) {
      const formateada = this.formatearISOaDDMMYYYY(fechaIso);
      if (tipo === 'desde') {
        this.filtroFechaInicio = fechaIso;
        this.fechaManualDesde = formateada;
      } else {
        this.filtroFechaFin = fechaIso;
        this.fechaManualHasta = formateada;
      }
      popover.dismiss();
    }
  }

  get listaFiltrada() {
    let filtrados = [...this.listaMinisterios];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(m =>
        m.nombre?.toLowerCase().includes(search) ||
        m.descripcion?.toLowerCase().includes(search)
      );
    }

    if (this.filtroFechaInicio) {
      const inicio = new Date(this.filtroFechaInicio).setHours(0, 0, 0, 0);
      filtrados = filtrados.filter(m => new Date(m.fecha).setHours(0, 0, 0, 0) >= inicio);
    }

    if (this.filtroFechaFin) {
      const fin = new Date(this.filtroFechaFin).setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(m => new Date(m.fecha).setHours(0, 0, 0, 0) <= fin);
    }

    return filtrados;
  }

  registrarMinisterio() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast('Por favor, completa los campos obligatorios correctamente.', 'danger');
      return;
    }

    const fechaFormateada = this.fechaManualForm;

    if (this.modoEdicion) {
      const index = this.listaMinisterios.findIndex(m => m.id === this.idEditando);
      if (index !== -1) {
        this.listaMinisterios[index] = { ...this.nuevoMinisterio, fechaFormateada };
        this.mostrarToast('Registro actualizado exitosamente', 'success');
      }
    } else {
      this.contadorId++;
      const nuevoRegistro = { ...this.nuevoMinisterio, id: this.contadorId, fechaFormateada };
      this.listaMinisterios = [nuevoRegistro, ...this.listaMinisterios];
      this.mostrarToast('Registro creado exitosamente', 'success');
    }

    this.guardarLocalStorage();
    this.resetFormulario();
  }

  editarMinisterio(item: Ministerio) {
    this.nuevoMinisterio.foto = '';
    setTimeout(() => {
      this.nuevoMinisterio = { ...item };
      this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoMinisterio.fecha);
      this.modoEdicion = true;
      this.idEditando = item.id;
      this.intentoEnvio = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async eliminarMinisterio(item: Ministerio) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el ministerio #${item.id}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.listaMinisterios = this.listaMinisterios.filter(m => m.id !== item.id);
            this.guardarLocalStorage();
            this.mostrarToast('Registro eliminado', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  resetFormulario() {
    this.nuevoMinisterio = {
      id: 0,
      fecha: new Date().toISOString(),
      nombre: '',
      descripcion: '',
      responsable: '',
      foto: '',
      estado: 'Activo'
    };
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoMinisterio.fecha);
    this.modoEdicion = false;
    this.idEditando = null;
    this.intentoEnvio = false;
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

        this.nuevoMinisterio.foto = canvas.toDataURL('image/jpeg', 0.7);
      };
    };
    reader.readAsDataURL(file);
  }

  eliminarFoto() {
    this.nuevoMinisterio.foto = '';
  }

  guardarLocalStorage() {
    localStorage.setItem('ministerios', JSON.stringify(this.listaMinisterios));
  }

  cargarDatos() {
    const data = localStorage.getItem('ministerios');
    if (data) {
      try {
        this.listaMinisterios = JSON.parse(data);
        if (this.listaMinisterios.length > 0) {
          const ids = this.listaMinisterios.map(m => m.id || 0);
          this.contadorId = Math.max(...ids);
        }
      } catch (e) {
        this.listaMinisterios = [];
      }
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  get esFormularioValido(): boolean {
    return (
      this.nuevoMinisterio.nombre?.trim().length >= 3 &&
      this.nuevoMinisterio.descripcion?.trim().length >= 3 &&
      this.nuevoMinisterio.responsable?.trim().length >= 2 &&
      this.fechaManualForm.length === 10
    );
  }
}
