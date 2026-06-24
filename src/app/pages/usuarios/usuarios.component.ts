import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
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
  trashOutline, addCircleOutline, optionsOutline, saveOutline, copyOutline,
  alertCircleOutline, chevronDownOutline, chevronUpOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from 'src/app/components/toolbar-menu-button/toolbar-menu-button.component';
import { Usuario, Ministerio } from '../../core/models';
import { DataService } from '../../services/data.service';
import { UsuariosService, UsuarioPayload, UsuarioCreateResponse } from '../../services/usuarios.service';
import { withLoading, getHttpErrorMessage } from '../../shared/utils/loading.util';
import { leerValorIonInputAsync } from '../../shared/utils/movimiento-form-sync.util';
import { FORM_GUARDADO_TOAST_MS, scrollAlErrorFormulario, refrescarListaTrasMutacion } from '../../shared/utils/form-guardado.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import {
  isRolSinMinisterio,
  ministeriosParaColaborador,
  ROL_COLABORADOR,
  validarUsuarioForm
} from '../../shared/utils/liderazgo.util';
import { ROLES, normalizarRol, AppRole } from '../../core/constants/roles.constants';
import {
  mensajeUsuarioEmailDuplicado,
  usuarioEmailDuplicado
} from '../../shared/utils/unicidad.util';

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
    rol:          ROLES.CONTABLE,
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
  filtroRol: AppRole | 'todos' = 'todos';
  filtroEstadoUsuario: 'todos' | 'Activo' | 'Inactivo' = 'todos';
  filtroMinisterioId: number | null = null;
  mostrarFiltrosAvanzados = false;
  fotoSeleccionada: string | null = null;
  contrasenaTemporal: { usuario: string; password: string } | null = null;
  guardando = false;
  formGuardadoError: string | null = null;

  @ViewChild('nombreInput') nombreInput?: IonInput;
  @ViewChild('emailInput') emailInput?: IonInput;
  @ViewChild('passwordInput') passwordInput?: IonInput;

  private destroy$ = new Subject<void>();

  columnsUsuarios: TableColumn[] = [
    { field: 'nombre', header: 'Nombre'                    },
    { field: 'email',  header: 'Email'                     },
    { field: 'rol',    header: 'Rol',    type: 'badge'     },
    { field: 'estado', header: 'Estado', type: 'badge'     }
  ];

  acciones = { edit: true, delete: true };
  rolesUsuario:   string[] = [ROLES.ADMIN, ROLES.CONTABLE, ROLES.COLABORADOR];
  estadosUsuario: string[] = ['Activo', 'Inactivo'];
  readonly ROL_COLABORADOR = ROLES.COLABORADOR;
  readonly isRolSinMinisterio = isRolSinMinisterio;
  readonly ROLES_CATALOGO = ROLES;

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
      'copy-outline':          copyOutline,
      'alert-circle-outline':  alertCircleOutline,
      'chevron-down-outline':  chevronDownOutline,
      'chevron-up-outline':    chevronUpOutline
    });
  }

  ngOnInit() {
    this.usuariosService.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => { this.listaUsuarios = list; });
    this.dataService.ministerios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarMinisterios());
    this.dataService.dataRevision$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarMinisterios());
    void this.inicializarDatos();
  }

  private async inicializarDatos(): Promise<void> {
    if (!this.dataService.hasRemoteData()) {
      await this.dataService.bootstrapRemote();
    }
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
    return !!(
      this.searchTerm ||
      this.filtroRol !== 'todos' ||
      this.filtroEstadoUsuario !== 'todos' ||
      this.filtroMinisterioId != null
    );
  }

  get hayFiltrosAvanzadosActivos(): boolean {
    return this.filtroMinisterioId != null;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroRol = 'todos';
    this.filtroEstadoUsuario = 'todos';
    this.filtroMinisterioId = null;
    this.mostrarFiltrosAvanzados = false;
  }

  seleccionarFiltroRol(rol: AppRole | 'todos'): void {
    this.filtroRol = rol;
  }

  seleccionarFiltroEstadoUsuario(estado: 'todos' | 'Activo' | 'Inactivo'): void {
    this.filtroEstadoUsuario = estado;
  }

  alternarFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  onFiltroMinisterioChange(): void {}

  get ministeriosParaFiltro(): Ministerio[] {
    return [...this.listaMinisterios].sort((a, b) =>
      (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es')
    );
  }

  contarUsuariosPorRol(rol: AppRole): number {
    return this.listaUsuarios.filter(u => normalizarRol(u.rol) === rol).length;
  }

  contarUsuariosPorEstado(estado: 'Activo' | 'Inactivo'): number {
    return this.listaUsuarios.filter(u => u.estado === estado).length;
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

    if (this.filtroRol !== 'todos') {
      filtrados = filtrados.filter(u => normalizarRol(u.rol) === this.filtroRol);
    }

    if (this.filtroEstadoUsuario !== 'todos') {
      filtrados = filtrados.filter(u => u.estado === this.filtroEstadoUsuario);
    }

    if (this.filtroMinisterioId != null) {
      filtrados = filtrados.filter(u => Number(u.ministerioId) === this.filtroMinisterioId);
    }

    return filtrados;
  }

  onRolChange(): void {
    if (isRolSinMinisterio(this.nuevoUsuario.rol)) {
      this.nuevoUsuario.ministerioId = undefined;
    }
  }

  get ministeriosParaColaborador(): Ministerio[] {
    return ministeriosParaColaborador(
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
    } else if (payload.rol === this.ROL_COLABORADOR && payload.ministerioId == null) {
      payload.ministerioId = null;
    }
    return payload;
  }

  async registrarUsuario() {
    if (this.guardando) return;

    this.intentoEnvio = true;
    this.formGuardadoError = null;
    await this.sincronizarFormularioAntesDeGuardar();

    if (!this.esFormularioValido) {
      this.formGuardadoError = this.mensajeValidacion;
      await this.mostrarToast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
      return;
    }

    const errorLiderazgo = validarUsuarioForm(
      this.nuevoUsuario,
      this.listaMinisterios,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null
    );
    if (errorLiderazgo) {
      this.formGuardadoError = errorLiderazgo;
      await this.mostrarToast(errorLiderazgo, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
      return;
    }

    const payload = this.prepararPayloadUsuario();
    this.guardando = true;

    try {
      if (this.modoEdicion && this.idEditando !== null) {
        await firstValueFrom(this.usuariosService.update(this.idEditando, payload));
        await this.mostrarToast('Usuario actualizado exitosamente', 'success');
        refrescarListaTrasMutacion(
          () => this.usuariosService.getAll(),
          lista => { this.listaUsuarios = lista; }
        );
        this.dataService.notifyChanges();
        this.resetFormulario();
      } else {
        const res = await firstValueFrom(this.usuariosService.create(payload)) as UsuarioCreateResponse;
        await this.mostrarToast('Usuario creado exitosamente', 'success');
        refrescarListaTrasMutacion(
          () => this.usuariosService.getAll(),
          lista => { this.listaUsuarios = lista; }
        );
        this.dataService.notifyChanges();
        this.resetFormulario();
        if (!this.password.trim() && res?.tempPassword) {
          this.mostrarContrasenaTemporal(
            res.usuario ?? payload.email ?? 'usuario',
            res.tempPassword
          );
        }
      }
    } catch (error) {
      this.formGuardadoError = getHttpErrorMessage(error, 'Error al guardar');
      await this.mostrarToast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
    } finally {
      this.guardando = false;
    }
  }

  private async sincronizarFormularioAntesDeGuardar(): Promise<void> {
    const [nombreRaw, emailRaw, passwordRaw] = await Promise.all([
      leerValorIonInputAsync(this.nombreInput),
      leerValorIonInputAsync(this.emailInput),
      leerValorIonInputAsync(this.passwordInput)
    ]);
    if (nombreRaw.trim()) {
      this.nuevoUsuario.nombre = nombreRaw.trim();
    }
    if (emailRaw.trim()) {
      this.nuevoUsuario.email = emailRaw.trim();
    }
    this.password = passwordRaw;
  }

  editarUsuario(item: Usuario) {
    setTimeout(() => {
      const rol = normalizarRol(item.rol) ?? item.rol;
      this.nuevoUsuario = { ...item, rol };
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
      rol:          ROLES.CONTABLE,
      estado:       'Activo',
      ministerioId: undefined
    };
    this.modoEdicion  = false;
    this.idEditando   = null;
    this.intentoEnvio = false;
    this.formGuardadoError = null;
    this.password = '';
  }

  cargarMinisterios() {
    this.listaMinisterios = this.dataService.getMinisteriosParaCatalogo();
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

  async mostrarToast(mensaje: string, color: string, duration = 2600): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color, duration);
  }

  get esFormularioValido(): boolean {
    const base =
      this.nuevoUsuario.nombre?.trim().length >= 3 &&
      this.nuevoUsuario.email?.trim().length  >= 5 &&
      this.nuevoUsuario.email?.includes('@') &&
      (this.password.trim() ? this.password.trim().length >= 6 : true);

    if (!base) return false;
    if (!this.nuevoUsuario.rol || !this.rolesUsuario.includes(this.nuevoUsuario.rol)) return false;
    if (!this.nuevoUsuario.estado || !this.estadosUsuario.includes(this.nuevoUsuario.estado)) return false;
    if (this.emailUsuarioDuplicado) return false;
    return validarUsuarioForm(
      this.nuevoUsuario,
      this.listaMinisterios,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null
    ) == null;
  }

  private get emailUsuarioDuplicado() {
    return usuarioEmailDuplicado(
      this.nuevoUsuario.email,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null
    );
  }

  get mensajeValidacion(): string {
    if (this.emailUsuarioDuplicado) {
      return mensajeUsuarioEmailDuplicado(this.emailUsuarioDuplicado);
    }
    return validarUsuarioForm(
      this.nuevoUsuario,
      this.listaMinisterios,
      this.listaUsuarios,
      this.modoEdicion ? this.idEditando : null
    ) ?? 'Completa los campos obligatorios correctamente.';
  }
}
