import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton,
  IonSearchbar, ToastController, IonPopover, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  documentTextOutline, saveOutline, notificationsOutline,
  pencilOutline, trashOutline, closeOutline, addCircleOutline, optionsOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';

// ✅ Interfaces importadas desde DataService — ya no se definen localmente
import { DataService, Ministerio, Usuario } from '../../services/data.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-ministerios',
  templateUrl: './ministerios.component.html',
  styleUrls: ['./ministerios.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
    IonIcon, IonItem, IonLabel, IonInput, IonButton,
    IonSearchbar, IonPopover, IonSelect, IonSelectOption,
    TablaGeneralComponent
  ],
  providers: [AlertController, ToastController]
})
export class MinisteriosComponent implements OnInit {

  // ✅ Tipado con interfaces del DataService
  listaUsuarios: Usuario[] = [];

  nuevoMinisterio: Ministerio = {
    id:         0,
    nombre:     '',
    estado:     'Activo',
    fecha:      '',
    hldrId:     undefined,
    coLiderId:  undefined
  };

  intentoEnvio = false;
  modoEdicion  = false;
  idEditando: number | null = null;
  contadorId  = 0;
  listaMinisterios: Ministerio[] = [];

  searchTerm:    string = '';
  filtroLiderId: number | null = null;

  columnsMinisterios: TableColumn[] = [
    { field: 'nombre',          header: 'Nombre'                   },
    { field: 'fechaFormateada', header: 'Creado'                   },
    { field: 'estado',          header: 'Estado', type: 'badge'    }
  ];

  acciones = { edit: true, delete: true };

  estadosMinisterio: string[] = ['Activo', 'Pausado', 'Inactivo'];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private dataService:     DataService
  ) {
    addIcons({
      'document-text-outline': documentTextOutline,
      'save-outline':          saveOutline,
      'notifications-outline': notificationsOutline,
      'pencil-outline':        pencilOutline,
      'trash-outline':         trashOutline,
      'close-outline':         closeOutline,
      'add-circle-outline':    addCircleOutline,
      'options-outline':       optionsOutline
    });
  }

  ngOnInit() {
    this.cargarDatos();
    this.cargarUsuarios();
  }

  private formatearISOaDDMMYYYY(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const dd   = String(date.getDate()).padStart(2, '0');
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  get listaFiltrada(): Ministerio[] {
    let filtrados = [...this.listaMinisterios];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(m => m.nombre?.toLowerCase().includes(search));
    }

    if (this.filtroLiderId !== null) {
      filtrados = filtrados.filter(m => m.hldrId === this.filtroLiderId);
    }

    return filtrados;
  }

  registrarMinisterio() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast('Por favor, completa los campos obligatorios correctamente.', 'danger');
      return;
    }

    const ahora          = new Date().toISOString();
    const fechaFormateada = this.formatearISOaDDMMYYYY(ahora);

    if (this.modoEdicion) {
      const index = this.listaMinisterios.findIndex(m => m.id === this.idEditando);
      if (index !== -1) {
        // Conservar la fecha original al editar
        const fechaOriginal = this.listaMinisterios[index].fechaFormateada;
        this.listaMinisterios[index] = {
          ...this.nuevoMinisterio,
          fechaFormateada: fechaOriginal
        };
        this.mostrarToast('Registro actualizado exitosamente', 'success');
      }
    } else {
      this.contadorId++;
      const nuevoRegistro: Ministerio = {
        ...this.nuevoMinisterio,
        id:               this.contadorId,
        fecha:            ahora,
        fechaFormateada
      };
      this.listaMinisterios = [nuevoRegistro, ...this.listaMinisterios];
      this.mostrarToast('Registro creado exitosamente', 'success');
    }

    this.guardarLocalStorage();
    this.resetFormulario();
  }

  editarMinisterio(item: Ministerio) {
    setTimeout(() => {
      this.nuevoMinisterio = { ...item };
      this.modoEdicion     = true;
      this.idEditando      = item.id;
      this.intentoEnvio    = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async eliminarMinisterio(item: Ministerio) {
    const alert = await this.alertController.create({
      header:  'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el ministerio #${item.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Eliminar',
          role:    'destructive',
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
      id:        0,
      nombre:    '',
      estado:    'Activo',
      fecha:     '',
      hldrId:    undefined,
      coLiderId: undefined
    };
    this.modoEdicion  = false;
    this.idEditando   = null;
    this.intentoEnvio = false;
  }

  guardarLocalStorage() {
    localStorage.setItem('ministerios', JSON.stringify(this.listaMinisterios));
    // ✅ Notificar al DataService igual que los otros módulos
    this.dataService.refreshAllData();
  }

  cargarDatos() {
    const data = localStorage.getItem('ministerios');
    if (data) {
      try {
        this.listaMinisterios = JSON.parse(data);
        if (this.listaMinisterios.length > 0) {
          const ids       = this.listaMinisterios.map(m => m.id || 0);
          this.contadorId = Math.max(...ids);
        }
      } catch (e) {
        this.listaMinisterios = [];
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

  cargarUsuarios() {
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

  get esFormularioValido(): boolean {
    return this.nuevoMinisterio.nombre?.trim().length >= 3;
  }
}