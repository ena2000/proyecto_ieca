import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton, IonSearchbar,
  ToastController, AlertController, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, expandOutline, closeOutline, pencilOutline,
  trashOutline, addCircleOutline, optionsOutline, saveOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';

// ✅ Interfaces importadas desde DataService — ya no se definen localmente
import { DataService, Usuario, Ministerio } from '../../services/data.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
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
    IonInput,
    IonButton,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    TablaGeneralComponent
  ],
  providers: [ToastController, AlertController]
})
export class UsuariosComponent implements OnInit {

  // ✅ Tipado con interfaces del DataService
  listaMinisterios: Ministerio[] = [];

  nuevoUsuario: Usuario = {
    id:           0,
    nombre:       '',
    email:        '',
    rol:          'Miembro',
    estado:       'Activo',
    ministerioId: undefined
  };

  intentoEnvio = false;
  modoEdicion  = false;
  idEditando: number | null = null;
  contadorId  = 0;
  listaUsuarios: Usuario[] = [];

  searchTerm:       string = '';
  fotoSeleccionada: string | null = null;

  columnsUsuarios: TableColumn[] = [
    { field: 'nombre', header: 'Nombre'                    },
    { field: 'email',  header: 'Email'                     },
    { field: 'rol',    header: 'Rol',    type: 'badge'     },
    { field: 'estado', header: 'Estado', type: 'badge'     }
  ];

  acciones = { edit: true, delete: true };

  rolesUsuario:   string[] = ['Administrador', 'Coordinador', 'Miembro'];
  estadosUsuario: string[] = ['Activo', 'Inactivo', 'Suspendido'];

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private dataService:     DataService
  ) {
    addIcons({
      'notifications-outline': notificationsOutline,
      'expand-outline':        expandOutline,
      'close-outline':         closeOutline,
      'pencil-outline':        pencilOutline,
      'trash-outline':         trashOutline,
      'add-circle-outline':    addCircleOutline,
      'options-outline':       optionsOutline,
      'save-outline':          saveOutline
    });
  }

  ngOnInit() {
    this.cargarDatos();
    this.cargarMinisterios();
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

  get listaFiltrada(): Usuario[] {
    let filtrados = [...this.listaUsuarios];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(u =>
        u.nombre?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      );
    }

    return filtrados;
  }

  registrarUsuario() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast('Por favor, completa los campos obligatorios correctamente.', 'danger');
      return;
    }

    if (this.modoEdicion) {
      const index = this.listaUsuarios.findIndex(u => u.id === this.idEditando);
      if (index !== -1) {
        this.listaUsuarios[index] = { ...this.nuevoUsuario };
        this.mostrarToast('Usuario actualizado exitosamente', 'success');
      }
    } else {
      this.contadorId++;
      const nuevoRegistro: Usuario = { ...this.nuevoUsuario, id: this.contadorId };
      this.listaUsuarios = [nuevoRegistro, ...this.listaUsuarios];
      this.mostrarToast('Usuario creado exitosamente', 'success');
    }

    this.guardarLocalStorage();
    this.resetFormulario();
  }

  editarUsuario(item: Usuario) {
    setTimeout(() => {
      this.nuevoUsuario = { ...item };
      this.modoEdicion  = true;
      this.idEditando   = item.id;
      this.intentoEnvio = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async eliminarUsuario(item: Usuario) {
    const alert = await this.alertController.create({
      header:  'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el usuario #${item.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Eliminar',
          role:    'destructive',
          handler: () => {
            this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== item.id);
            this.guardarLocalStorage();
            this.mostrarToast('Usuario eliminado', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  resetFormulario() {
    this.nuevoUsuario = {
      id:           0,
      nombre:       '',
      email:        '',
      rol:          'Miembro',
      estado:       'Activo',
      ministerioId: undefined
    };
    this.modoEdicion  = false;
    this.idEditando   = null;
    this.intentoEnvio = false;
  }

  cargarMinisterios() {
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
  }

  guardarLocalStorage() {
    localStorage.setItem('usuarios', JSON.stringify(this.listaUsuarios));
    // ✅ Notificar al DataService para mantener el estado global sincronizado
    this.dataService.refreshAllData();
  }

  cargarDatos() {
    const data = localStorage.getItem('usuarios');
    if (data) {
      try {
        this.listaUsuarios = JSON.parse(data);
        if (this.listaUsuarios.length > 0) {
          const ids       = this.listaUsuarios.map(u => u.id || 0);
          this.contadorId = Math.max(...ids);
        }
      } catch (e) {
        this.listaUsuarios = [];
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
      this.nuevoUsuario.nombre?.trim().length >= 3 &&
      this.nuevoUsuario.email?.trim().length  >= 5 &&
      this.nuevoUsuario.email?.includes('@')
    );
  }
}