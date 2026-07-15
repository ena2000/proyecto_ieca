import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton,
  IonSearchbar, IonSelect, IonSelectOption,
  IonModal, IonSpinner,
  ToastController
} from '@ionic/angular/standalone';

import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  documentTextOutline, saveOutline, notificationsOutline,
  pencilOutline, trashOutline, closeOutline, addCircleOutline, optionsOutline,
  readerOutline, walletOutline, alertCircleOutline,
  chevronDownOutline, chevronUpOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from 'src/app/components/toolbar-menu-button/toolbar-menu-button.component';
import { Ministerio, Usuario, KardexLinea } from '../../core/models';
import { DataService } from '../../services/data.service';
import { aIdNumericoONull, mismoIdNumerico } from '../../shared/utils/id-coerce.util';
import { MinisteriosService } from '../../services/ministerios.service';
import { getHttpErrorMessage } from '../../shared/utils/loading.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { leerValorIonInput, leerValorIonInputAsync } from '../../shared/utils/movimiento-form-sync.util';
import { confirmarAccionDestructiva } from '../../shared/utils/confirmacion-alerta.util';
import { FORM_GUARDADO_TOAST_MS, scrollAlErrorFormulario, refrescarListaTrasMutacion } from '../../shared/utils/form-guardado.util';
import {
  AccionFilaEnCurso,
  etiquetaAccionFilaEnCurso
} from '../../shared/utils/movimiento-accion.util';
import {
  colaboradoresEnMinisterio,
  esRolColaborador,
  nombresColaboradoresMinisterio
} from '../../shared/utils/liderazgo.util';
import {
  mensajeMinisterioDuplicado,
  ministerioNombreDuplicado
} from '../../shared/utils/unicidad.util';
import {
  MINISTERIO_NOMBRE_MAX,
  validarNombreMinisterio
} from '../../shared/utils/ministerio-nombre.util';
import { esEstadoMinisterioValido } from '../../shared/utils/usuario-validacion.util';

registerLocaleData(localeEs);

@Component({
  selector: 'app-ministerios',
  templateUrl: './ministerios.component.html',
  styleUrls: ['./ministerios.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
    IonIcon, IonItem, IonLabel, IonInput, IonButton,
    IonSearchbar, IonSelect, IonSelectOption, IonModal, IonSpinner,
    TablaGeneralComponent,
    NotificacionesBellComponent, ToolbarMenuButtonComponent
  ],
  providers: [AlertController, ToastController],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MinisteriosComponent implements OnInit, OnDestroy, ViewWillEnter {

  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild('nombreInput') nombreInput?: IonInput;

  listaUsuarios: Usuario[] = [];

  nuevoMinisterio: Ministerio = {
    id:         0,
    nombre:     '',
    estado:     'Activo',
    fecha:      ''
  };

  intentoEnvio = false;
  modoEdicion  = false;
  idEditando: number | null = null;
  listaMinisterios: Ministerio[] = [];
  vistaMinisterios: Array<Ministerio & { colaboradoresNombre: string; saldo: number }> = [];
  formularioValido = false;
  guardando = false;
  accionFilaEnCurso: AccionFilaEnCurso | null = null;
  formGuardadoError: string | null = null;
  readonly nombreMaxLength = MINISTERIO_NOMBRE_MAX;
  readonly etiquetaAccionFilaEnCurso = etiquetaAccionFilaEnCurso;

  searchTerm:           string = '';
  filtroColaboradorId: number | null = null;
  filtroEstadoMinisterio: 'todos' | 'Activo' | 'Pausado' | 'Inactivo' = 'todos';
  mostrarFiltrosAvanzados = false;

  private destroy$ = new Subject<void>();

  columnsMinisterios: TableColumn[] = [
    { field: 'nombre',               header: 'Nombre'                },
    { field: 'colaboradoresNombre',  header: 'Colaboradores'         },
    { field: 'saldo',                header: 'Saldo disponible', type: 'currency' },
    { field: 'estado',               header: 'Estado', type: 'badge' }
  ];

  acciones = { edit: true, delete: true, ledger: true };
  estadosMinisterio: string[] = ['Activo', 'Pausado', 'Inactivo'];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private dataService: DataService,
    private ministeriosService: MinisteriosService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'document-text-outline': documentTextOutline,
      'save-outline':          saveOutline,
      'notifications-outline': notificationsOutline,
      'pencil-outline':        pencilOutline,
      'trash-outline':         trashOutline,
      'close-outline':         closeOutline,
      'add-circle-outline':    addCircleOutline,
      'options-outline':       optionsOutline,
      'reader-outline':        readerOutline,
      'wallet-outline':        walletOutline,
      'alert-circle-outline':  alertCircleOutline,
      'chevron-down-outline':  chevronDownOutline,
      'chevron-up-outline':    chevronUpOutline
    });
  }

  kardexAbierto = false;
  ministerioKardex: Ministerio | null = null;
  lineasKardex: KardexLinea[] = [];

  ngOnInit() {
    this.ministeriosService.ministerios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.listaMinisterios = list;
        this.actualizarVista();
      });
    this.dataService.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarVista());
    this.dataService.dataRevision$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.ministerioKardex) {
          this.lineasKardex = this.dataService.getKardexMinisterio(this.ministerioKardex.id);
        }
        this.actualizarVista();
      });
    void this.inicializarDatos();
  }

  private async inicializarDatos(): Promise<void> {
    await this.dataService.bootstrapRemote();
    if (!this.ministeriosService.getAll().length) {
      this.ministeriosService.reload();
    }
    this.actualizarVista();
  }

  ionViewWillEnter(): void {
    void this.dataService.bootstrapRemote().then(() => {
      if (!this.ministeriosService.getAll().length) {
        this.ministeriosService.reload();
      }
      this.actualizarVista();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get colaboradoresParaFiltro(): Usuario[] {
    return this.listaUsuarios.filter(u => esRolColaborador(u.rol) && u.estado !== 'Inactivo');
  }

  get hayFiltrosActivos(): boolean {
    return !!(
      this.searchTerm ||
      this.filtroColaboradorId !== null ||
      this.filtroEstadoMinisterio !== 'todos'
    );
  }

  get hayFiltrosAvanzadosActivos(): boolean {
    return this.filtroColaboradorId !== null;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroColaboradorId = null;
    this.filtroEstadoMinisterio = 'todos';
    this.mostrarFiltrosAvanzados = false;
    this.actualizarVista();
  }

  seleccionarFiltroEstadoMinisterio(estado: 'todos' | 'Activo' | 'Pausado' | 'Inactivo'): void {
    this.filtroEstadoMinisterio = estado;
    this.actualizarVista();
  }

  alternarFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  contarMinisteriosPorEstado(estado: 'Activo' | 'Pausado' | 'Inactivo'): number {
    return this.listaMinisterios.filter(m => m.estado === estado).length;
  }

  onFiltrosChange(): void {
    this.filtroColaboradorId = aIdNumericoONull(this.filtroColaboradorId);
    this.actualizarVista();
  }

  onFormularioChange(): void {
    this.formGuardadoError = null;
    this.actualizarValidacionFormulario();
    this.cdr.markForCheck();
  }

  onNombreInput(event: Event): void {
    this.nuevoMinisterio = {
      ...this.nuevoMinisterio,
      nombre: leerValorIonInput(event)
    };
    this.onFormularioChange();
  }

  private actualizarVista(): void {
    this.cargarUsuarios();

    let filtrados = [...this.listaMinisterios];
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(m => m.nombre?.toLowerCase().includes(search));
    }
    if (this.filtroEstadoMinisterio !== 'todos') {
      filtrados = filtrados.filter(m => m.estado === this.filtroEstadoMinisterio);
    }
    if (this.filtroColaboradorId !== null) {
      const uid = this.filtroColaboradorId;
      filtrados = filtrados.filter(m =>
        colaboradoresEnMinisterio(m.id, this.listaUsuarios).some(u => mismoIdNumerico(u.id, uid))
      );
    }

    this.vistaMinisterios = filtrados.map(m => ({
      ...m,
      colaboradoresNombre: nombresColaboradoresMinisterio(m.id, this.listaUsuarios, m),
      saldo: this.dataService.calcularSaldoMinisterio(m.id)
    }));

    this.actualizarValidacionFormulario();
    this.cdr.markForCheck();
  }

  private actualizarValidacionFormulario(): void {
    this.formularioValido = this.esFormularioValido;
  }

  get saldoKardexActual(): number {
    if (!this.lineasKardex.length) return 0;
    return this.lineasKardex[this.lineasKardex.length - 1].saldo;
  }

  get lineasKardexVista(): KardexLinea[] {
    return [...this.lineasKardex].reverse();
  }

  verKardex(item: Ministerio): void {
    this.ministerioKardex = item;
    this.lineasKardex = this.dataService.getKardexMinisterio(item.id);
    this.kardexAbierto = true;
  }

  cerrarKardex(): void {
    this.kardexAbierto = false;
    this.ministerioKardex = null;
    this.lineasKardex = [];
  }

  async registrarMinisterio() {
    if (this.guardando) return;

    this.intentoEnvio = true;
    this.formGuardadoError = null;
    await this.sincronizarFormularioAntesDeGuardar();
    this.actualizarValidacionFormulario();
    this.cdr.markForCheck();

    if (!this.esFormularioValido) {
      this.formGuardadoError = this.mensajeValidacion;
      this.cdr.markForCheck();
      await this.mostrarToast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    try {
      if (this.modoEdicion && this.idEditando !== null) {
        const existente = this.listaMinisterios.find(m => m.id === this.idEditando);
        const { hldrId, coLiderId, liderNombre, coLiderNombre, ...datos } = this.nuevoMinisterio;
        await firstValueFrom(this.ministeriosService.update(this.idEditando, {
          ...datos,
          id: this.idEditando,
          fechaFormateada: existente?.fechaFormateada
        }));
        this.resetFormulario();
        await this.mostrarToast('Registro actualizado exitosamente', 'success');
      } else {
        const { id, fecha, fechaFormateada, hldrId, coLiderId, liderNombre, coLiderNombre, ...datos } = this.nuevoMinisterio;
        await firstValueFrom(this.ministeriosService.create(datos));
        // Reset inmediato: evita el flash falso de «ya existe» mientras el toast está visible.
        this.resetFormulario();
        await this.mostrarToast('Registro creado exitosamente', 'success');
      }

      refrescarListaTrasMutacion(
        () => this.ministeriosService.getAll(),
        lista => { this.listaMinisterios = lista; },
        () => this.actualizarVista()
      );
      this.dataService.notifyChanges();
    } catch (error) {
      this.formGuardadoError = getHttpErrorMessage(error, 'Error al guardar');
      this.cdr.markForCheck();
      await this.mostrarToast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
    } finally {
      this.guardando = false;
      this.actualizarVista();
    }
  }

  private async sincronizarFormularioAntesDeGuardar(): Promise<void> {
    const nombreRaw = await leerValorIonInputAsync(this.nombreInput);
    if (nombreRaw.trim()) {
      this.nuevoMinisterio = { ...this.nuevoMinisterio, nombre: nombreRaw.trim() };
    }
  }

  editarMinisterio(item: Ministerio) {
    setTimeout(() => {
      const { hldrId, coLiderId, liderNombre, coLiderNombre, ...datos } = item;
      this.nuevoMinisterio = { ...datos };
      this.modoEdicion     = true;
      this.idEditando      = item.id;
      this.intentoEnvio    = false;
      this.actualizarVista();
      void this.content?.scrollToTop(300);
    }, 50);
  }

  async eliminarMinisterio(item: Ministerio): Promise<void> {
    if (this.accionFilaEnCurso) return;

    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) {
      await this.mostrarToast('No se pudo identificar el ministerio.', 'danger');
      return;
    }

    const bloqueo = this.mensajeBloqueoEliminacionMinisterio(id);
    if (bloqueo) {
      await this.mostrarToast(bloqueo, 'warning', 4200);
      return;
    }

    const confirmado = await confirmarAccionDestructiva(this.alertController, {
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el ministerio "${item.nombre?.trim() || 'sin nombre'}"? Solo se permite si no tiene historial.`
    });
    if (!confirmado) return;

    const listaAntes = [...this.listaMinisterios];
    this.accionFilaEnCurso = { id, tipo: 'eliminar' };
    this.cdr.detectChanges();

    try {
      await firstValueFrom(this.ministeriosService.delete(id));
      refrescarListaTrasMutacion(
        () => this.ministeriosService.getAll(),
        lista => { this.listaMinisterios = lista; },
        () => this.actualizarVista()
      );
      this.dataService.notifyChanges();
      await this.mostrarToast('Registro eliminado', 'warning');
    } catch (error) {
      this.listaMinisterios = listaAntes;
      this.actualizarVista();
      const msg = getHttpErrorMessage(error, 'Error al eliminar');
      await this.mostrarToast(msg, 'danger', 4200);
    } finally {
      this.accionFilaEnCurso = null;
      this.cdr.detectChanges();
    }
  }

  /** Conserva historial: no borrar si hay ingresos, gastos o usuarios ligados. */
  private mensajeBloqueoEliminacionMinisterio(ministerioId: number): string | null {
    const id = Number(ministerioId);
    const nIngresos = this.dataService
      .getIngresosActuales()
      .filter(i => Number(i.ministerioId) === id).length;
    const nGastos = this.dataService
      .getGastosActuales()
      .filter(g => Number(g.ministerioId) === id).length;
    const nUsuarios = this.dataService
      .getUsuariosActuales()
      .filter(u => Number(u.ministerioId) === id).length;

    if (nIngresos === 0 && nGastos === 0 && nUsuarios === 0) {
      return null;
    }

    const partes: string[] = [];
    if (nIngresos > 0) partes.push(`${nIngresos} ingreso(s)`);
    if (nGastos > 0) partes.push(`${nGastos} gasto(s)`);
    if (nUsuarios > 0) partes.push(`${nUsuarios} usuario(s)`);
    return (
      `No se puede eliminar: tiene historial (${partes.join(', ')}). ` +
      'Márcalo como Inactivo para conservarlo.'
    );
  }

  resetFormulario() {
    this.nuevoMinisterio = {
      id:        0,
      nombre:    '',
      estado:    'Activo',
      fecha:     ''
    };
    this.modoEdicion  = false;
    this.idEditando   = null;
    this.intentoEnvio = false;
    this.formGuardadoError = null;
    this.actualizarVista();
  }

  private cargarUsuarios(): void {
    this.listaUsuarios = this.dataService.getUsuariosActuales();
  }

  async mostrarToast(mensaje: string, color: string, duration = 2600): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color, duration);
  }

  get esFormularioValido(): boolean {
    if (validarNombreMinisterio(this.nuevoMinisterio.nombre)) return false;
    if (!esEstadoMinisterioValido(this.nuevoMinisterio.estado)) return false;
    if (this.nombreMinisterioDuplicado) return false;
    return true;
  }

  get nombreMinisterioDuplicado(): Ministerio | null {
    return ministerioNombreDuplicado(
      this.nuevoMinisterio.nombre,
      this.listaMinisterios,
      this.modoEdicion ? this.idEditando : null
    );
  }

  get mensajeValidacion(): string {
    const nombreErr = validarNombreMinisterio(this.nuevoMinisterio.nombre);
    if (nombreErr) return nombreErr;
    if (!esEstadoMinisterioValido(this.nuevoMinisterio.estado)) {
      return 'Selecciona un estado válido (Activo, Pausado o Inactivo).';
    }
    if (this.nombreMinisterioDuplicado) {
      return mensajeMinisterioDuplicado(this.nombreMinisterioDuplicado);
    }
    return 'Completa los campos requeridos.';
  }

  get validacionNombreError(): string | null {
    return validarNombreMinisterio(this.nuevoMinisterio.nombre);
  }
}
