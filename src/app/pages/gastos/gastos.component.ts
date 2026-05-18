import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

// Importación selectiva de componentes de Ionic (Standalone)
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
  closeCircleOutline, expandOutline, closeOutline, addCircleOutline, optionsOutline, businessOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';

registerLocaleData(localeEs);

// Interfaz para definir la estructura de un Gasto
interface Gasto {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  categoria: string;
  proveedor: string;
  fechaFormateada?: string;
}

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

  // Control de fecha manual en formato DD/MM/AAAA para el formulario principal
  fechaManualForm: string = '';
  
  // Objeto enlazado al formulario de registro/edición
  nuevoGasto: Gasto = {
    id: 0,
    fecha: new Date().toISOString(),
    descripcion: '',
    monto: null,
    foto: '',
    categoria: 'Servicios',
    proveedor: ''
  };

  // Estados de control de flujo
  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  contadorId = 0;
  listaGastos: Gasto[] = [];
  listaFiltrada: Gasto[] = [];

  // Propiedades para búsquedas y filtros
  searchTerm: string = '';
  fechaManualDesde: string = '';
  fechaManualHasta: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroMontoMin: number | null = null;
  filtroMontoMax: number | null = null;
  filtroCategoria: string = 'Todos';

  // Estado para la previsualización a pantalla completa (Lightbox)
  fotoSeleccionada: string | null = null;

  // Configuración de las columnas para la tabla general reutilizable
  columnsGastos: TableColumn[] = [
    { field: 'foto', header: 'Evidencia', type: 'image' },
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'categoria', header: 'Categoría' },
    { field: 'proveedor', header: 'Proveedor/Beneficiario' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'monto', header: 'Monto', type: 'currency' }
  ];

  // Configuración de las acciones permitidas en la tabla
  acciones = {
    edit: true,
    delete: true
  };

  // Listado oficial de categorías de gastos
  categoriasGastos: string[] = [
    'Servicios', 
    'Suministros', 
    'Mantenimiento', 
    'Personal', 
    'Impuestos', 
    'Otros'
  ];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController 
  ) {
    // Inicialización explícita de íconos requeridos para Ionic Standalone
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
      'business-outline': businessOutline
    });
  }

  ngOnInit() {
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.cargarDatos();
    this.filtrarGastos();
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
        this.nuevoGasto.fecha = dateObj.toISOString();
        this.filtrarGastos();
      }
    }
  }

  onFechaPickerChange(event: any, popoverRef: IonPopover) {
    const isoString = event.detail.value;
    if (isoString) {
      this.nuevoGasto.fecha = isoString;
      this.fechaManualForm = this.formatearISOaDDMMYYYY(isoString);
    }
    popoverRef.dismiss();
  }

  onArchivoSeleccionado(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
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
        
        this.nuevoGasto.foto = canvas.toDataURL('image/jpeg', 0.7);
      };
    };
    reader.readAsDataURL(file);
  }

  eliminarFoto() {
    this.nuevoGasto.foto = '';
  }

  guardarGasto() {
    this.intentoEnvio = true;

    if (!this.nuevoGasto.monto || this.nuevoGasto.monto <= 0 || 
        this.nuevoGasto.descripcion.trim().length < 3 || 
        this.nuevoGasto.proveedor.trim().length < 2 || 
        this.fechaManualForm.length !== 10) {
      this.mostrarToast('Por favor, llene todos los campos obligatorios correctamente.', 'danger');
      return;
    }

    if (this.modoEdicion && this.idEditando !== null) {
      const index = this.listaGastos.findIndex(g => g.id === this.idEditando);
      if (index !== -1) {
        this.listaGastos[index] = {
          ...this.nuevoGasto,
          id: this.idEditando,
          fechaFormateada: this.fechaManualForm
        };
        this.mostrarToast('Gasto modificado exitosamente.', 'success');
      }
    } else {
      this.contadorId++;
      const gastoAGuardar: Gasto = {
        ...this.nuevoGasto,
        id: this.contadorId,
        fechaFormateada: this.fechaManualForm
      };
      this.listaGastos.push(gastoAGuardar);
      this.mostrarToast('Gasto registrado exitosamente.', 'success');
    }

    this.guardarLocalStorage();
    this.resetFormulario();
    this.filtrarGastos();
  }

  editarGasto(gasto: Gasto) {
    this.modoEdicion = true;
    this.idEditando = gasto.id;
    this.nuevoGasto = { ...gasto };
    this.fechaManualForm = this.formatearISOaDDMMYYYY(gasto.fecha);
    this.intentoEnvio = false;
    
    const content = document.querySelector('ion-content');
    if (content) content.scrollToTop(400);
  }

  async eliminarGasto(gasto: Gasto) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar el registro de gasto #${gasto.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.listaGastos = this.listaGastos.filter(g => g.id !== gasto.id);
            this.guardarLocalStorage();
            this.filtrarGastos();
            this.mostrarToast('Registro eliminado.', 'danger');
            if (this.modoEdicion && this.idEditando === gasto.id) {
              this.resetFormulario();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  cancelarEdicion() {
    this.resetFormulario();
  }

  resetFormulario() {
    this.nuevoGasto = {
      id: 0,
      fecha: new Date().toISOString(),
      descripcion: '',
      monto: null,
      foto: '',
      categoria: 'Servicios',
      proveedor: ''
    };
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.modoEdicion = false;
    this.idEditando = null;
    this.intentoEnvio = false;
  }

  filtrarGastos() {
    this.listaFiltrada = this.listaGastos.filter(gasto => {
      const cumpleBuscar = this.searchTerm.trim() === '' || 
        gasto.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        gasto.proveedor.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const cumpleCategoria = this.filtroCategoria === 'Todos' || gasto.categoria === this.filtroCategoria;
      
      let cumpleMonto = true;
      if (this.filtroMontoMin !== null && (gasto.monto === null || gasto.monto < this.filtroMontoMin)) cumpleMonto = false;
      if (this.filtroMontoMax !== null && (gasto.monto === null || gasto.monto > this.filtroMontoMax)) cumpleMonto = false;
      
      return cumpleBuscar && cumpleCategoria && cumpleMonto;
    });
  }

  guardarLocalStorage() {
    localStorage.setItem('gastos', JSON.stringify(this.listaGastos));
  }

  cargarDatos() {
    const data = localStorage.getItem('gastos');
    if (data) {
      try {
        this.listaGastos = JSON.parse(data);
        if (this.listaGastos.length > 0) {
          const ids = this.listaGastos.map(g => g.id || 0);
          this.contadorId = Math.max(...ids);
        }
      } catch (e) {
        this.listaGastos = [];
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
}