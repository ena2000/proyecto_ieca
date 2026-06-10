import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton, IonSearchbar,
  ToastController, AlertController, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, expandOutline, closeOutline, pencilOutline,
  trashOutline, addCircleOutline, optionsOutline, saveOutline, copyOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from 'src/app/components/toolbar-menu-button/toolbar-menu-button.component';
import { Usuario, Ministerio } from '../../core/models';
import { DataService } from '../../services/data.service';
import { UsuariosService, UsuarioPayload, UsuarioCreateResponse } from '../../services/usuarios.service';
import { withLoading } from '../../shared/utils/loading.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import {
  isRolSinMinisterio,
  ministeriosConCupoParaLider,
  ROL_LIDER,
  validarUsuarioForm
} from '../../shared/utils/liderazgo.util';
import { ROLES } from '../../core/constants/roles.constants';

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
    NotificacionesBellComponent,
    ToolbarMenuButtonComponent
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
  contrasenaTemporal: { usuario: string; password: string } | null = null;

  private destroy$ = new Subject<void>();

  columnsUsuarios: TableColumn[] = [
    { field: 'nombre', header: 'Nombre'                    },
    { field: 'email',  header: 'Email'                     },
    { field: 'rol',    header: 'Rol',    type: 'badge'     },
    { field: 'estado', header: 'Estado', type: 'badge'     }
  ];

  acciones = { edit: true, delete: true };
  rolesUsuario:   string[] = [ROLES.ADMIN, ROLES.CONTABLE, ROLES.LIDER];
  estadosUsuario: string[] = ['Activo', 'Inactivo', 'Suspendido'];
  readonly ROL_LIDER = ROLES.LIDER;
  readonly isRolSinMinisterio = isRolSinMinisterio;

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
      'save-outline':          saveOutline,
      'copy-outline':          copyOutline
    });
  }

  ngOnInit() {
    this.usuariosService.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => { this.listaUsuarios = list; });
    this.dataService.ministerios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarMinisterios());
    this.cargarMinisterios();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', [])
  handleEscapeKey() {
    if (this.contrasenaTemporal) {
      this.cerrarContrasenaTemporal();
    } else if (this.fotoSeleccionada) {
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
    if (isRolSinMinisterio(this.nuevoUsuario.rol)) {
      this.nuevoUsuario.ministerioId = undefined;
    }
  }

  get ministeriosParaLider(): Ministerio[] {
    return ministeriosConCupoParaLider(
      this.listaMinisterios,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null,
      this.nuevoUsuario.ministerioId ?? null
    );
  }

  private prepararPayloadUsuario(): UsuarioPayload {
    const { id, ...datos } = this.nuevoUsuario;
    const payload: UsuarioPayload = {
      ...(datos as UsuarioPayload),
      ...(this.password.trim() ? { password: this.password } : {})
    };
    if (isRolSinMinisterio(payload.rol)) {
      payload.ministerioId = undefined;
    } else if (payload.rol === this.ROL_LIDER && payload.ministerioId == null) {
      payload.ministerioId = null;
    }
    return payload;
  }

  async registrarUsuario() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast(this.mensajeValidacion, 'danger');
      return;
    }

    const errorLiderazgo = validarUsuarioForm(
      this.nuevoUsuario,
      this.listaMinisterios,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null
    );
    if (errorLiderazgo) {
      this.mostrarToast(errorLiderazgo, 'danger');
      return;
    }

    const payload = this.prepararPayloadUsuario();

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
            this.mostrarContrasenaTemporal(
              res.usuario ?? payload.email ?? 'usuario',
              res.tempPassword
            );
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
      message: `¿Estás seguro de eliminar al usuario "${item.nombre?.trim() || item.email || 'sin nombre'}"?`,
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

  mostrarContrasenaTemporal(usuario: string, password: string): void {
    this.contrasenaTemporal = { usuario, password };
    document.body.style.overflow = 'hidden';
  }

  cerrarContrasenaTemporal(): void {
    this.contrasenaTemporal = null;
    document.body.style.overflow = 'auto';
  }

  async copiarContrasenaTemporal(): Promise<void> {
    const password = this.contrasenaTemporal?.password;
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      await this.mostrarToast('Contraseña copiada al portapapeles', 'success');
    } catch {
      await this.mostrarToast('No se pudo copiar. Selecciónala manualmente.', 'warning');
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    await presentIecaToast(this.toastController, mensaje, color);
  }

  get esFormularioValido(): boolean {
    const base =
      this.nuevoUsuario.nombre?.trim().length >= 3 &&
      this.nuevoUsuario.email?.trim().length  >= 5 &&
      this.nuevoUsuario.email?.includes('@') &&
      (this.password.trim() ? this.password.trim().length >= 6 : true);

    if (!base) return false;
    return validarUsuarioForm(
      this.nuevoUsuario,
      this.listaMinisterios,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null
    ) == null;
  }

  get mensajeValidacion(): string {
    return validarUsuarioForm(
      this.nuevoUsuario,
      this.listaMinisterios,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null
    ) ?? 'Completa los campos obligatorios correctamente.';
  }
}
