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
  calendarOutline, cashOutline, documentTextOutline, cloudUploadOutline,
  saveOutline, notificationsOutline, pencilOutline, trashOutline,
  closeCircleOutline, expandOutline, closeOutline, addCircleOutline, optionsOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';

// ✅ Interfaces importadas desde DataService — ya no se definen localmente
import { DataService, Gasto, Ministerio, Usuario } from '../../services/data.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.scss'],
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
export class GastosComponent implements OnInit {

  fechaManualForm: string = '';

  // ✅ Tipado con interfaces del DataService
  listaMinisterios: Ministerio[] = [];
  listaUsuarios: Usuario[] = [];

  nuevoGasto: Gasto = {
    id:            0,
    fecha:         new Date().toISOString(),
    descripcion:   '',
    monto:         null,
    foto:          '',
    categoria:     'Servicios',
    proveedor:     '',
    ministerioId:  undefined,
    usuarioId:     undefined,
    registradoPor: 'Sistema'
  };

  intentoEnvio = false;
  modoEdicion  = false;
  idEditando: number | null = null;
  contadorId  = 0;
  listaGastos: Gasto[] = [];

  searchTerm:        string = '';
  fechaManualDesde:  string = '';
  fechaManualHasta:  string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin:    string = '';
  filtroMontoMin: number | null = null;
  filtroMontoMax: number | null = null;

  fotoSeleccionada: string | null = null;

  categoriasGasto: string[] = ['Servicios', 'Suministros', 'Mantenimiento', 'Personal', 'Impuestos', 'Otros'];

  columnsGastos: TableColumn[] = [
    { field: 'foto',            header: 'Evidencia', type: 'image'    },
    { field: 'fechaFormateada', header: 'Fecha'                       },
    { field: 'categoria',       header: 'Categoría'                   },
    { field: 'proveedor',       header: 'Proveedor/Beneficiario'      },
    { field: 'descripcion',     header: 'Descripción'                 },
    { field: 'monto',           header: 'Monto',     type: 'currency' }
  ];

  acciones = { edit: true, delete: true };

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private dataService:     DataService
  ) {
    addIcons({
      'calendar-outline':      calendarOutline,
      'cash-outline':          cashOutline,
      'document-text-outline': documentTextOutline,
      'cloud-upload-outline':  cloudUploadOutline,
      'save-outline':          saveOutline,
      'notifications-outline': notificationsOutline,
      'pencil-outline':        pencilOutline,
      'trash-outline':         trashOutline,
      'close-circle-outline':  closeCircleOutline,
      'expand-outline':        expandOutline,
      'close-outline':         closeOutline,
      'add-circle-outline':    addCircleOutline,
      'options-outline':       optionsOutline
    });
  }

  ngOnInit() {
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.cargarDatos();
    this.cargarRelaciones();
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
    const dd   = String(date.getDate()).padStart(2, '0');
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  validarFechaManualForm(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    this.fechaManualForm = val;

    if (val.length === 10) {
      const parts   = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        this.nuevoGasto.fecha = dateObj.toISOString();
      }
    }
  }

  onFechaPickerChange(event: any, popover: IonPopover) {
    const fechaIso = event.detail.value;
    if (fechaIso) {
      this.nuevoGasto.fecha = fechaIso;
      this.fechaManualForm  = this.formatearISOaDDMMYYYY(fechaIso);
      popover.dismiss();
    }
  }

  validarFechaManual(event: any, tipo: 'desde' | 'hasta') {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);

    if (tipo === 'desde') {
      this.fechaManualDesde = val;
    } else {
      this.fechaManualHasta = val;
    }

    if (val.length === 10) {
      const parts   = val.split('/');
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
        this.fechaManualDesde  = formateada;
      } else {
        this.filtroFechaFin   = fechaIso;
        this.fechaManualHasta = formateada;
      }
      popover.dismiss();
    }
  }

  get listaFiltrada(): Gasto[] {
    let filtrados = [...this.listaGastos];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(g =>
        g.descripcion?.toLowerCase().includes(search) ||
        g.proveedor?.toLowerCase().includes(search)
      );
    }

    if (this.filtroFechaInicio) {
      const inicio = new Date(this.filtroFechaInicio).setHours(0, 0, 0, 0);
      filtrados = filtrados.filter(g => new Date(g.fecha).setHours(0, 0, 0, 0) >= inicio);
    }

    if (this.filtroFechaFin) {
      const fin = new Date(this.filtroFechaFin).setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(g => new Date(g.fecha).setHours(0, 0, 0, 0) <= fin);
    }

    if (this.filtroMontoMin !== null) {
      filtrados = filtrados.filter(g => (g.monto || 0) >= this.filtroMontoMin!);
    }
    if (this.filtroMontoMax !== null) {
      filtrados = filtrados.filter(g => (g.monto || 0) <= this.filtroMontoMax!);
    }

    return filtrados;
  }

  registrarGasto() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast('Por favor, completa los campos obligatorios correctamente.', 'danger');
      return;
    }

    const fechaFormateada = this.fechaManualForm;

    if (this.modoEdicion) {
      const index = this.listaGastos.findIndex(g => g.id === this.idEditando);
      if (index !== -1) {
        this.listaGastos[index] = { ...this.nuevoGasto, fechaFormateada };
        this.mostrarToast('Registro actualizado exitosamente', 'success');
      }
    } else {
      this.contadorId++;
      const nuevoRegistro: Gasto = { ...this.nuevoGasto, id: this.contadorId, fechaFormateada };
      this.listaGastos = [nuevoRegistro, ...this.listaGastos];
      this.mostrarToast('Registro creado exitosamente', 'success');
    }

    this.guardarLocalStorage();
    this.resetFormulario();
  }

  editarGasto(item: Gasto) {
    this.nuevoGasto.foto = '';
    setTimeout(() => {
      this.nuevoGasto      = { ...item };
      this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
      this.modoEdicion     = true;
      this.idEditando      = item.id;
      this.intentoEnvio    = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async eliminarGasto(item: Gasto) {
    const alert = await this.alertController.create({
      header:  'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el registro #${item.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Eliminar',
          role:    'destructive',
          handler: () => {
            this.listaGastos = this.listaGastos.filter(g => g.id !== item.id);
            this.guardarLocalStorage();
            this.mostrarToast('Registro eliminado', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  resetFormulario() {
    this.nuevoGasto = {
      id:            0,
      fecha:         new Date().toISOString(),
      descripcion:   '',
      monto:         null,
      foto:          '',
      categoria:     'Servicios',
      proveedor:     '',
      ministerioId:  undefined,
      usuarioId:     undefined,
      registradoPor: 'Sistema'
    };
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.modoEdicion     = false;
    this.idEditando      = null;
    this.intentoEnvio    = false;
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader   = new FileReader();
    reader.onload  = (e: any) => {
      const img  = new Image();
      img.src    = e.target.result;
      img.onload = () => {
        const canvas    = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width       = img.width;
        let height      = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width   = MAX_WIDTH;
        }

        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        this.nuevoGasto.foto = canvas.toDataURL('image/jpeg', 0.7);
      };
    };
    reader.readAsDataURL(file);
  }

  eliminarFoto() {
    this.nuevoGasto.foto = '';
  }

  cargarRelaciones() {
    const datosMinisterios = localStorage.getItem('ministerios');
    if (datosMinisterios) {
      try {
        const ministerios     = JSON.parse(datosMinisterios);
        this.listaMinisterios = ministerios.map((m: any, idx: number) => ({
          id:     m.id || idx,
          nombre: m.nombre,
          estado: m.estado ?? 'Activo'
        }));
      } catch (e) {
        this.listaMinisterios = [];
      }
    }

    const datosUsuarios = localStorage.getItem('usuarios');
    if (datosUsuarios) {
      try {
        const usuarios     = JSON.parse(datosUsuarios);
        this.listaUsuarios = usuarios.map((u: any, idx: number) => ({
          id:     u.id || idx,
          nombre: u.nombre,
          email:  u.email
        }));
      } catch (e) {
        this.listaUsuarios = [];
      }
    }
  }

  guardarLocalStorage() {
    localStorage.setItem('gastos', JSON.stringify(this.listaGastos));
    this.dataService.refreshAllData();
  }

  cargarDatos() {
    const data = localStorage.getItem('gastos');
    if (data) {
      try {
        this.listaGastos = JSON.parse(data);
        if (this.listaGastos.length > 0) {
          const ids       = this.listaGastos.map(g => g.id || 0);
          this.contadorId = Math.max(...ids);
        }
      } catch (e) {
        this.listaGastos = [];
      }
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message:  mensaje,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  get esFormularioValido(): boolean {
    return (
      this.nuevoGasto.descripcion?.trim().length >= 3 &&
      this.nuevoGasto.monto !== null &&
      this.nuevoGasto.monto > 0 &&
      this.nuevoGasto.proveedor?.trim().length >= 2 &&
      this.fechaManualForm.length === 10
    );
  }
}