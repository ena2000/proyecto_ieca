import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton, IonSearchbar,
  ToastController, AlertController, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, expandOutline, closeOutline, pencilOutline,
  trashOutline, addCircleOutline, optionsOutline, saveOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { Usuario, Ministerio } from '../../core/models';
import { DataService } from '../../services/data.service';
import { UsuariosService, UsuarioPayload, UsuarioCreateResponse } from '../../services/usuarios.service';
import { withLoading } from '../../shared/utils/loading.util';

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
    TablaGeneralComponent,
    NotificacionesBellComponent
  ],
  providers: [ToastController, AlertController, LoadingController]
})
export class UsuariosComponent implements OnInit, OnDestroy {

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
  listaUsuarios: Usuario[] = [];

  // Contraseña solo para backend (se hashea). Vacía = no cambiar.
  password = '';

  searchTerm:       string = '';
  fotoSeleccionada: string | null = null;

  private destroy$ = new Subject<void>();

  columnsUsuarios: TableColumn[] = [
    { field: 'nombre', header: 'Nombre'                    },
    { field: 'email',  header: 'Email'                     },
    { field: 'rol',    header: 'Rol',    type: 'badge'     },
    { field: 'estado', header: 'Estado', type: 'badge'     }
  ];

  acciones = { edit: true, delete: true };
  rolesUsuario:   string[] = ['Administrador', 'Contable', 'Lider/CoLider'];
  estadosUsuario: string[] = ['Activo', 'Inactivo', 'Suspendido'];
  readonly ROL_LIDER = 'Lider/CoLider';

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private dataService: DataService,
    private usuariosService: UsuariosService
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
    this.usuariosService.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => { this.listaUsuarios = list; });
    this.cargarMinisterios();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  get hayFiltrosActivos(): boolean {
    return !!this.searchTerm;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
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

  onRolChange(): void {
    if (this.nuevoUsuario.rol !== this.ROL_LIDER) {
      this.nuevoUsuario.ministerioId = undefined;
    }
  }

  async registrarUsuario() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast('Por favor, completa los campos obligatorios correctamente.', 'danger');
      return;
    }

    const { id, ...datos } = this.nuevoUsuario;
    const payload: UsuarioPayload = {
      ...(datos as UsuarioPayload),
      ...(this.password.trim() ? { password: this.password } : {})
    };

    const guardando = this.modoEdicion ? 'Actualizando usuario...' : 'Guardando usuario...';

    try {
      await withLoading(this.loadingController, guardando, async () => {
        if (this.modoEdicion && this.idEditando !== null) {
          await firstValueFrom(this.usuariosService.update(this.idEditando, payload));
          await this.mostrarToast('Usuario actualizado exitosamente', 'success');
        } else {
          const res = await firstValueFrom(this.usuariosService.create(payload)) as UsuarioCreateResponse;
          await this.mostrarToast('Usuario creado exitosamente', 'success');
          if (!this.password.trim() && res?.tempPassword) {
            const alert = await this.alertController.create({
              header: 'Contraseña temporal',
              message:
                `Usuario: ${res.usuario}\n` +
                `Contraseña temporal: ${res.tempPassword}\n\n` +
                `Compártela una sola vez. Al iniciar sesión puede cambiarla.`,
              buttons: ['OK']
            });
            await alert.present();
          }
        }
      });

      this.resetFormulario();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      this.mostrarToast(msg, 'danger');
    }
  }

  editarUsuario(item: Usuario) {
    setTimeout(() => {
      this.nuevoUsuario = { ...item };
      this.modoEdicion  = true;
      this.idEditando   = item.id;
      this.intentoEnvio = false;
      this.password = '';
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
          handler: async () => {
            try {
              await withLoading(this.loadingController, 'Eliminando usuario...', async () => {
                await firstValueFrom(this.usuariosService.delete(item.id));
              });
              this.mostrarToast('Usuario eliminado', 'warning');
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'Error al eliminar';
              this.mostrarToast(msg, 'danger');
            }
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
    this.password = '';
  }

  cargarMinisterios() {
    this.listaMinisterios = this.dataService.getMinisteriosActuales();
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
      this.nuevoUsuario.email?.includes('@') &&
      // Password opcional: si se omite al crear, el backend genera una temporal.
      (this.password.trim() ? this.password.trim().length >= 6 : true)
    );
  }
}
