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
  closeCircleOutline, expandOutline, closeOutline, addCircleOutline, optionsOutline
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

  // Propiedades para búsquedas y filtros
  searchTerm: string = '';
  fechaManualDesde: string = '';
  fechaManualHasta: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroMontoMin: number | null = null;
  filtroMontoMax: number | null = null;

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
      'options-outline': optionsOutline
    });
  }

  ngOnInit() {
    this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.cargarDatos();
  }
  
  @HostListener('document:keydown.escape', [])
  handleEscapeKey() {
    if (this.fotoSeleccionada) {
      this.cerrarImagen();
    }
  }

  // Activa el overlay para ver la imagen en tamaño completo
  verImagen(foto: any) { 
    if (foto && typeof foto === 'string') {
      this.fotoSeleccionada = foto;
      document.body.style.overflow = 'hidden'; 
    }
  }

  // Desactiva el visor de imágenes y restablece el scroll
  cerrarImagen() {
    this.fotoSeleccionada = null;
    document.body.style.overflow = 'auto'; 
  }

  // Transforma una cadena ISO string a formato legible DD/MM/AAAA
  private formatearISOaDDMMYYYY(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // Máscara y validación en tiempo real para el input de fecha del formulario
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
      }
    }
  }

  // Maneja el cambio originado desde el selector de fecha visual (IonDatetime) del formulario
  onFechaPickerChange(event: any, popover: IonPopover) {
    const fechaIso = event.detail.value;
    if (fechaIso) {
      this.nuevoGasto.fecha = fechaIso;
      this.fechaManualForm = this.formatearISOaDDMMYYYY(fechaIso);
      popover.dismiss(); 
    }
  }

  // Máscara de texto para las fechas de los filtros avanzados en la tabla
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

  // Maneja el cambio originado por los IonDatetime de la sección de filtros avanzados
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

  // Getter que devuelve la lista filtrada dinámicamente según términos, montos y rangos de fechas
  get listaFiltrada() {
    let filtrados = [...this.listaGastos];

    // Filtro por término de búsqueda (Descripción o Proveedor)
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(g => 
        g.descripcion?.toLowerCase().includes(search) || 
        g.proveedor?.toLowerCase().includes(search)
      );
    }

    // Filtro por rango: Fecha Inicial (00:00:00)
    if (this.filtroFechaInicio) {
      const inicio = new Date(this.filtroFechaInicio).setHours(0,0,0,0);
      filtrados = filtrados.filter(g => new Date(g.fecha).setHours(0,0,0,0) >= inicio);
    }

    // Filtro por rango: Fecha Final (23:59:59)
    if (this.filtroFechaFin) {
      const fin = new Date(this.filtroFechaFin).setHours(23,59,59,999);
      filtrados = filtrados.filter(g => new Date(g.fecha).setHours(0,0,0,0) <= fin);
    }

    // Filtro por rangos de valores numéricos (Montos)
    if (this.filtroMontoMin !== null) {
      filtrados = filtrados.filter(g => (g.monto || 0) >= this.filtroMontoMin!);
    }
    if (this.filtroMontoMax !== null) {
      filtrados = filtrados.filter(g => (g.monto || 0) <= this.filtroMontoMax!);
    }

    return filtrados;
  }

  // Ejecuta la inserción o actualización del registro contable
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
      const nuevoRegistro = { ...this.nuevoGasto, id: this.contadorId, fechaFormateada };
      this.listaGastos = [nuevoRegistro, ...this.listaGastos];
      this.mostrarToast('Registro creado exitosamente', 'success');
    }

    this.guardarLocalStorage();
    this.resetFormulario(); 
  }

  // Carga un registro existente en el formulario y realiza un scroll suave hacia arriba
  editarGasto(item: Gasto) {
    this.nuevoGasto.foto = ''; 
    setTimeout(() => {
      this.nuevoGasto = { ...item };
      this.fechaManualForm = this.formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
      this.modoEdicion = true;
      this.idEditando = item.id;
      this.intentoEnvio = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  // Despliega una alerta de confirmación nativa antes de remover un registro
  async eliminarGasto(item: Gasto) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el registro #${item.id}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
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

  // Limpia el formulario y restablece los valores iniciales correctos de la aplicación
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

  // Captura la imagen subida, reduce proporcionalmente su tamaño usando HTML5 Canvas y la guarda en Base64
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
        
        this.nuevoGasto.foto = canvas.toDataURL('image/jpeg', 0.7);
      };
    };
    reader.readAsDataURL(file);
  }

  // Elimina la referencia en base64 de la foto cargada en el formulario
  eliminarFoto() {
    this.nuevoGasto.foto = '';
  }

  // Persistencia de los datos del array actual en el LocalStorage
  guardarLocalStorage() {
    localStorage.setItem('gastos', JSON.stringify(this.listaGastos));
  }

  // Recupera los registros del LocalStorage manejando excepciones de parsing JSON
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

  // Helper centralizado para desplegar Toasts flotantes informativos de Ionic
  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
  
  // Evalúa que las condiciones obligatorias del formulario de negocio se cumplan al 100%
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