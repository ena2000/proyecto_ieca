import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy,
  HostListener, ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { ViewWillEnter } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton,
  IonSearchbar, ToastController, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TablaGeneralComponent, TableColumn, TableActions } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from 'src/app/components/toolbar-menu-button/toolbar-menu-button.component';
import { formatearISOaDDMMYYYY } from '../../shared/utils/date.util';
import { abrirSelectorFechaNativo, isoToDateInputValue, resetNativosDateInputs } from '../../shared/utils/date-picker.util';
import { procesarComprobante, esComprobantePdf } from '../../shared/utils/comprobante-upload.util';
import { withLoading } from '../../shared/utils/loading.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { estadoIngreso, etiquetaEstadoIngreso, ingresoPendiente, categoriaIngreso } from '../../shared/utils/ingreso.util';
import { registerMovimientoPageIcons } from '../../shared/utils/movimiento-page.icons';
import { filtrarMovimientos, hayFiltrosMovimientoActivos, FiltrosMovimiento } from '../../shared/utils/movimiento-filtros.util';
import {
  formatearEntradaFechaManual,
  isoDesdeFechaManualDDMMYYYY,
  actualizarDesdeFechaNativa,
  aplicarFechaManualFiltro,
  actualizarEstadoFiltroFechaMovimiento,
  CampoFechaMovimiento
} from '../../shared/utils/movimiento-fecha.util';
import { accionesTablaMovimiento } from '../../shared/utils/movimiento-acciones.util';
import {
  ministeriosEnAlcance,
  perteneceAlcanceMinisterio,
  aplicarMinisterioAlMovimiento
} from '../../shared/utils/movimiento-ministerio.util';
import { leerFiltroPendientesDesdeRuta, limpiarQueryPendientes } from '../../shared/utils/movimiento-query.util';
import { esFormularioMovimientoValido, mensajeValidacionMovimiento } from '../../shared/utils/movimiento-validacion.util';
import { estaPendienteParaAprobacion, resolverEstadoAlGuardar } from '../../shared/utils/movimiento-estado.util';
import {
  abrirVisorComprobante,
  cerrarVisorComprobante,
  mensajeErrorGuardadoMovimiento
} from '../../shared/utils/movimiento-comprobante.util';
import {
  CUENTAS_INGRESO_OPCIONES,
  cuentaIngresoPorDefecto,
  etiquetaOpcionCuenta,
  resolverCuentaIngresoLegacy
} from '../../shared/constants/contabilidad-cuentas.constants';
import { aplicarResponsableSesion, etiquetaResponsableMovimiento } from '../../shared/utils/movimiento-responsable.util';
import { aplicarCuentaEnIngreso, inicializarCuentaIngreso } from '../../shared/utils/contabilidad-cuenta-form.util';
import { ingresoEsTalento } from '../../shared/utils/aportacion-iglesia.util';
import { Ingreso, Ministerio, Usuario } from '../../core/models';
import { DataService } from '../../services/data.service';
import { IngresosService } from '../../services/ingresos.service';
import { AuthService } from '../../core/services/auth.service';
import { CierreService } from '../../core/services/cierre.service';
import {
  aplicarValoresTextoAlMovimiento,
  leerValorIonInput,
  leerValorIonInputAsync,
  normalizarMontoFormulario,
  sincronizarFechaFormularioMovimiento,
  validarTamanoComprobante
} from '../../shared/utils/movimiento-form-sync.util';
import { FORM_GUARDADO_TOAST_MS, scrollAlErrorFormulario, refrescarListaTrasMutacion } from '../../shared/utils/form-guardado.util';

registerLocaleData(localeEs);

const INGRESO_VACIO = (): Ingreso => {
  const ingreso: Ingreso = {
    id: 0,
    fecha: new Date().toISOString(),
    descripcion: '',
    monto: null,
    foto: '',
    categoria: '',
    ministerio: 'General',
    ministerioId: undefined,
    usuarioId: undefined,
    registradoPor: 'Sistema'
  };
  inicializarCuentaIngreso(ingreso, cuentaIngresoPorDefecto());
  return ingreso;
};

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
    IonIcon, IonItem, IonLabel, IonInput, IonButton, IonSearchbar,
    IonSelectOption, IonSelect,
    TablaGeneralComponent, NotificacionesBellComponent, ToolbarMenuButtonComponent
  ],
  providers: [AlertController, ToastController, LoadingController],
  changeDetection: ChangeDetectionStrategy.Default
})
export class IngresosComponent implements OnInit, OnDestroy, ViewWillEnter {
  readonly isoToDateInputValue = isoToDateInputValue;

  @ViewChild('dateInputForm') dateInputForm?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputDesde') dateInputDesde?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputHasta') dateInputHasta?: ElementRef<HTMLInputElement>;
  @ViewChild('comprobanteInput') comprobanteInput?: ElementRef<HTMLInputElement>;
  @ViewChild('montoInput') montoInput?: IonInput;
  @ViewChild('descripcionInput') descripcionInput?: IonInput;
  @ViewChild('fechaInput') fechaInput?: IonInput;

  fechaManualForm = '';
  listaMinisterios: Ministerio[] = [];
  listaUsuarios: Usuario[] = [];
  nuevoIngreso: Ingreso = INGRESO_VACIO();
  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  listaIngresos: Ingreso[] = [];
  listaFiltradaVista: Ingreso[] = [];
  pendientesCount = 0;

  private destroy$ = new Subject<void>();

  searchTerm = '';
  fechaManualDesde = '';
  fechaManualHasta = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';
  filtroMontoMin: number | null = null;
  filtroMontoMax: number | null = null;
  filtroSoloPendientes = false;

  comprobanteSeleccionado: string | null = null;
  comprobanteEsPdf = false;
  registrando = false;
  formGuardadoError: string | null = null;

  readonly cuentasIngreso = CUENTAS_INGRESO_OPCIONES;
  readonly etiquetaOpcionCuenta = etiquetaOpcionCuenta;
  columnsIngresos: TableColumn[] = [
    { field: 'foto', header: 'Comprobante', type: 'evidence' },
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'estadoEtiqueta', header: 'Estado', type: 'badge' },
    { field: 'cuentaNombre', header: 'Cuenta', type: 'badge' },
    { field: 'ministerio', header: 'Ministerio' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'monto', header: 'Monto', type: 'currency' }
  ];

  acciones: TableActions = { edit: true, delete: true };
  soloLectura = false;
  puedeAprobar = false;
  ministerioScopeId: number | null = null;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private dataService: DataService,
    private ingresosService: IngresosService,
    readonly authService: AuthService,
    private cierreService: CierreService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    registerMovimientoPageIcons();
  }

  ngOnInit(): void {
    void this.cierreService.cargar();
    this.inicializarPermisos();
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    this.ingresosService.ingresos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.listaIngresos = list;
        this.actualizarVista();
      });
    this.dataService.dataRevision$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarVista());
    void this.inicializarDatos();
  }

  private async inicializarDatos(): Promise<void> {
    if (!this.dataService.hasRemoteData()) {
      await this.dataService.bootstrapRemote();
    }
    this.cargarRelaciones();
    this.actualizarVista();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.inicializarPermisos();
    void this.cierreService.cargar();
    this.filtroSoloPendientes = leerFiltroPendientesDesdeRuta(
      this.route.snapshot.queryParamMap.get('pendientes')
    );
    if (!this.dataService.hasRemoteData()) {
      void this.dataService.bootstrapRemote().then(() => {
        this.cargarRelaciones();
        this.actualizarVista();
      });
    } else {
      this.cargarRelaciones();
      this.actualizarVista();
    }
  }

  private inicializarPermisos(): void {
    this.soloLectura = this.authService.isSoloLecturaFinanzas();
    this.puedeAprobar = this.authService.isAdministrador();
    this.ministerioScopeId = this.authService.getMinisterioScopeId();
    this.acciones = accionesTablaMovimiento({
      puedeAprobar: this.puedeAprobar,
      soloLectura: this.soloLectura,
      esAdministrador: this.authService.isAdministrador(),
      esLider: this.authService.isLider()
    });
  }

  private get filtros(): FiltrosMovimiento {
    return {
      searchTerm: this.searchTerm,
      filtroFechaInicio: this.filtroFechaInicio,
      filtroFechaFin: this.filtroFechaFin,
      fechaManualDesde: this.fechaManualDesde,
      fechaManualHasta: this.fechaManualHasta,
      filtroMontoMin: this.filtroMontoMin,
      filtroMontoMax: this.filtroMontoMax,
      filtroSoloPendientes: this.filtroSoloPendientes
    };
  }

  get periodoFormularioCerrado(): boolean {
    return this.cierreService.estaCerrado(this.nuevoIngreso.fecha);
  }

  get etiquetaPeriodoFormulario(): string {
    return this.cierreService.etiquetaPeriodo(this.nuevoIngreso.fecha);
  }

  movimientoEnPeriodoCerrado(item: Ingreso): boolean {
    return this.cierreService.estaCerrado(item.fecha, item.cerrado);
  }

  onFiltrosChange(): void {
    this.actualizarVista();
  }

  alternarFiltroPendientes(): void {
    this.filtroSoloPendientes = !this.filtroSoloPendientes;
    this.actualizarVista();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.comprobanteSeleccionado) this.cerrarComprobante();
  }

  verComprobante(url: string): void {
    if (!url) return;
    const state = abrirVisorComprobante(url);
    this.comprobanteSeleccionado = state.comprobanteSeleccionado;
    this.comprobanteEsPdf = state.comprobanteEsPdf;
  }

  cerrarComprobante(): void {
    const state = cerrarVisorComprobante();
    this.comprobanteSeleccionado = state.comprobanteSeleccionado;
    this.comprobanteEsPdf = state.comprobanteEsPdf;
  }

  get esPdfFormulario(): boolean {
    return esComprobantePdf(this.nuevoIngreso.foto);
  }

  validarFechaManualForm(event: Event): void {
    const val = formatearEntradaFechaManual(leerValorIonInput(event));
    this.fechaManualForm = val;
    const iso = isoDesdeFechaManualDDMMYYYY(val);
    if (iso) {
      this.nuevoIngreso = { ...this.nuevoIngreso, fecha: iso };
    }
    this.cdr.markForCheck();
  }

  onFormFieldChange(): void {
    this.formGuardadoError = null;
    this.cdr.markForCheck();
  }

  onMontoInput(event: Event): void {
    const monto = normalizarMontoFormulario(leerValorIonInput(event));
    this.nuevoIngreso = { ...this.nuevoIngreso, monto };
    this.onFormFieldChange();
  }

  onDescripcionInput(event: Event): void {
    this.nuevoIngreso = { ...this.nuevoIngreso, descripcion: leerValorIonInput(event) };
    this.onFormFieldChange();
  }

  abrirSelectorFecha(tipo: CampoFechaMovimiento): void {
    const input = tipo === 'form'
      ? this.dateInputForm?.nativeElement
      : tipo === 'desde'
        ? this.dateInputDesde?.nativeElement
        : this.dateInputHasta?.nativeElement;
    abrirSelectorFechaNativo(input);
  }

  onNativeDateChange(value: string, tipo: CampoFechaMovimiento): void {
    const upd = actualizarDesdeFechaNativa(value, tipo);
    if (tipo === 'form') {
      if (upd.fechaIso !== undefined) {
        this.nuevoIngreso.fecha = upd.fechaIso || new Date().toISOString();
      }
      if (upd.fechaManualForm != null) this.fechaManualForm = upd.fechaManualForm;
      this.cdr.markForCheck();
      return;
    }
    this.aplicarCambioFiltroFecha(tipo, upd);
  }

  validarFechaManual(event: Event, tipo: 'desde' | 'hasta'): void {
    const upd = aplicarFechaManualFiltro(leerValorIonInput(event), tipo);
    this.aplicarCambioFiltroFecha(tipo, upd);
  }

  private aplicarCambioFiltroFecha(
    tipo: 'desde' | 'hasta',
    upd: Partial<{
      filtroFechaInicio: string;
      filtroFechaFin: string;
      fechaManualDesde: string;
      fechaManualHasta: string;
    }>
  ): void {
    const res = actualizarEstadoFiltroFechaMovimiento(tipo, upd, {
      filtroFechaInicio: this.filtroFechaInicio,
      filtroFechaFin: this.filtroFechaFin,
      fechaManualDesde: this.fechaManualDesde,
      fechaManualHasta: this.fechaManualHasta
    });
    if (!res.ok) {
      void this.mostrarToast(res.mensaje, 'warning');
    }
    this.filtroFechaInicio = res.estado.filtroFechaInicio;
    this.filtroFechaFin = res.estado.filtroFechaFin;
    this.fechaManualDesde = res.estado.fechaManualDesde;
    this.fechaManualHasta = res.estado.fechaManualHasta;
    if (res.resetNativo === 'desde') {
      resetNativosDateInputs([this.dateInputDesde?.nativeElement]);
    } else if (res.resetNativo === 'hasta') {
      resetNativosDateInputs([this.dateInputHasta?.nativeElement]);
    }
    this.actualizarVista();
    this.cdr.markForCheck();
  }

  get ministerioBloqueado(): boolean {
    return this.ministerioScopeId != null;
  }

  get ministeriosFormulario(): Ministerio[] {
    return ministeriosEnAlcance(this.listaMinisterios, this.ministerioScopeId);
  }

  get etiquetaResponsableFormulario(): string {
    return etiquetaResponsableMovimiento(
      this.nuevoIngreso,
      this.listaUsuarios,
      this.authService.getSession()
    );
  }

  get hayFiltrosActivos(): boolean {
    return hayFiltrosMovimientoActivos(this.filtros);
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.fechaManualDesde = '';
    this.fechaManualHasta = '';
    this.filtroMontoMin = null;
    this.filtroMontoMax = null;
    this.filtroSoloPendientes = false;
    resetNativosDateInputs([
      this.dateInputDesde?.nativeElement,
      this.dateInputHasta?.nativeElement
    ]);
    limpiarQueryPendientes(this.route, this.router);
    this.actualizarVista();
    this.cdr.markForCheck();
  }

  private actualizarVista(): void {
    this.listaFiltradaVista = filtrarMovimientos({
      items: this.listaIngresos,
      ministerioScopeId: this.ministerioScopeId,
      filtros: this.filtros,
      textoBusqueda: i => [
        i.descripcion ?? '',
        i.cuentaNombre ?? categoriaIngreso(i) ?? '',
        i.cuentaCodigo ?? ''
      ],
      esPendiente: ingresoPendiente,
      enriquecer: i => ({
        ...i,
        cuentaNombre: i.cuentaNombre || categoriaIngreso(i) || '—',
        estado: estadoIngreso(i),
        estadoEtiqueta: etiquetaEstadoIngreso(estadoIngreso(i))
      })
    });
    this.pendientesCount = this.listaIngresos.filter(i => ingresoPendiente(i)).length;
    this.cdr.markForCheck();
  }

  private normalizarIngreso(): Ingreso {
    const estado = resolverEstadoAlGuardar({
      esLider: this.authService.isLider(),
      modoEdicion: this.modoEdicion,
      idEditando: this.idEditando,
      lista: this.listaIngresos,
      estadoAprobado: 'aprobado',
      estadoPendiente: 'pendiente',
      leerEstado: estadoIngreso
    });
    return {
      ...this.nuevoIngreso,
      estado,
      motivoRechazo: estado === 'pendiente' ? undefined : this.nuevoIngreso.motivoRechazo
    };
  }

  async registrarIngreso(): Promise<void> {
    if (this.registrando) return;

    this.intentoEnvio = true;
    this.formGuardadoError = null;
    await this.sincronizarFormularioAntesDeGuardar();
    this.aplicarAlcanceMinisterioAlFormulario();
    this.cdr.markForCheck();

    if (this.periodoFormularioCerrado) {
      this.formGuardadoError =
        `El periodo ${this.etiquetaPeriodoFormulario} está cerrado. No se pueden registrar movimientos.`;
      await this.mostrarToast(this.formGuardadoError, 'warning');
      return;
    }

    const comprobanteErr = validarTamanoComprobante(this.nuevoIngreso.foto);
    if (comprobanteErr) {
      this.formGuardadoError = comprobanteErr;
      await this.mostrarToast(comprobanteErr, 'danger', FORM_GUARDADO_TOAST_MS);
      return;
    }

    this.cargarRelaciones();
    if (!this.esFormularioValido) {
      this.formGuardadoError = this.mensajeValidacion;
      await this.mostrarToast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
      this.cdr.markForCheck();
      return;
    }

    const fechaFormateada = this.fechaManualForm;
    const preparado = this.ingresosService.resolveRelations(
      this.normalizarIngreso(),
      this.listaMinisterios,
      this.listaUsuarios
    );

    this.registrando = true;
    this.cdr.markForCheck();
    try {
      if (this.modoEdicion && this.idEditando !== null) {
        await firstValueFrom(this.ingresosService.update(this.idEditando, preparado, fechaFormateada));
        const msg = this.authService.isLider()
          ? 'Ingreso actualizado y enviado a aprobación'
          : 'Registro actualizado exitosamente';
        await this.mostrarToast(msg, 'success');
      } else {
        await firstValueFrom(this.ingresosService.create(preparado, fechaFormateada));
        const msg = this.authService.isLider()
          ? 'Ingreso registrado. Queda pendiente de aprobación.'
          : 'Registro creado exitosamente';
        await this.mostrarToast(msg, 'success');
      }
      refrescarListaTrasMutacion(
        () => this.ingresosService.getAll(),
        lista => { this.listaIngresos = lista; },
        () => this.actualizarVista()
      );
      this.dataService.notifyChanges();
      this.resetFormulario();
    } catch (error) {
      this.formGuardadoError = mensajeErrorGuardadoMovimiento(error, 'Error al guardar el registro');
      await this.mostrarToast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
    } finally {
      this.registrando = false;
      this.cdr.markForCheck();
    }
  }

  private async sincronizarFormularioAntesDeGuardar(): Promise<void> {
    const [montoRaw, descripcionRaw, fechaRaw] = await Promise.all([
      leerValorIonInputAsync(this.montoInput),
      leerValorIonInputAsync(this.descripcionInput),
      leerValorIonInputAsync(this.fechaInput)
    ]);

    this.nuevoIngreso = aplicarValoresTextoAlMovimiento(
      this.nuevoIngreso,
      montoRaw,
      descripcionRaw
    );

    if (fechaRaw.trim()) {
      this.fechaManualForm = formatearEntradaFechaManual(fechaRaw);
    }

    const monto = normalizarMontoFormulario(this.nuevoIngreso.monto);
    if (monto != null) {
      this.nuevoIngreso = { ...this.nuevoIngreso, monto };
    }

    const syncFecha = sincronizarFechaFormularioMovimiento(
      this.fechaManualForm,
      this.nuevoIngreso.fecha
    );
    this.fechaManualForm = syncFecha.fechaManualForm;
    if (syncFecha.fechaIso) {
      this.nuevoIngreso = { ...this.nuevoIngreso, fecha: syncFecha.fechaIso };
    }

    if (this.nuevoIngreso.cuentaCodigo?.trim()) {
      aplicarCuentaEnIngreso(this.nuevoIngreso, this.nuevoIngreso.cuentaCodigo);
    }
  }

  async aprobarIngreso(item: Ingreso): Promise<void> {
    if (!this.puedeAprobar) {
      await this.mostrarToast('Solo el administrador puede aprobar ingresos.', 'warning');
      return;
    }
    if (!estaPendienteParaAprobacion(item)) {
      await this.mostrarToast('Este ingreso ya no está pendiente de aprobación.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No se puede aprobar un ingreso de un periodo cerrado.', 'warning');
      return;
    }
    const id = Number(item.id);
    if (!Number.isFinite(id)) {
      await this.mostrarToast('No se pudo identificar el ingreso.', 'danger');
      return;
    }
    try {
      await firstValueFrom(this.ingresosService.aprobar(id));
      this.dataService.notifyChanges();
      await this.mostrarToast(
        ingresoEsTalento(item)
          ? 'Ingreso de talento aprobado. Se transfirió el 33% al fondo de la iglesia.'
          : 'Ingreso aprobado',
        'success'
      );
      this.cdr.markForCheck();
    } catch (error) {
      await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo aprobar', 'danger');
    }
  }

  async rechazarIngreso(item: Ingreso): Promise<void> {
    if (!this.puedeAprobar) {
      await this.mostrarToast('Solo el administrador puede rechazar ingresos.', 'warning');
      return;
    }
    if (!estaPendienteParaAprobacion(item)) {
      await this.mostrarToast('Este ingreso ya no está pendiente de aprobación.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No se puede rechazar un ingreso de un periodo cerrado.', 'warning');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Rechazar ingreso',
      message: 'Indica el motivo del rechazo (opcional).',
      inputs: [{ name: 'motivo', type: 'textarea', placeholder: 'Motivo...' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: async (data) => {
            try {
              await firstValueFrom(this.ingresosService.rechazar(Number(item.id), data?.motivo));
              this.dataService.notifyChanges();
              await this.mostrarToast('Ingreso rechazado', 'warning');
              this.cdr.markForCheck();
            } catch (error) {
              await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo rechazar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  editarIngreso(item: Ingreso): void {
    if (!perteneceAlcanceMinisterio(item, this.ministerioScopeId)) {
      void this.mostrarToast('No puedes editar registros de otro ministerio.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      void this.mostrarToast('No puedes editar ingresos de un periodo cerrado.', 'warning');
      return;
    }
    if (this.authService.isLider() && estadoIngreso(item) === 'aprobado') {
      void this.mostrarToast('No puedes editar un ingreso ya aprobado.', 'warning');
      return;
    }
    this.nuevoIngreso.foto = '';
    setTimeout(() => {
      this.nuevoIngreso = { ...item };
      if (!this.nuevoIngreso.cuentaCodigo) {
        const legacy = resolverCuentaIngresoLegacy(categoriaIngreso(this.nuevoIngreso));
        aplicarCuentaEnIngreso(this.nuevoIngreso, legacy.codigo);
      }
      this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
      this.modoEdicion = true;
      this.idEditando = item.id;
      this.intentoEnvio = false;
      this.aplicarResponsableAlFormulario();
      this.cdr.markForCheck();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async eliminarIngreso(item: Ingreso): Promise<void> {
    if (!perteneceAlcanceMinisterio(item, this.ministerioScopeId)) {
      await this.mostrarToast('No puedes eliminar registros de otro ministerio.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No puedes eliminar ingresos de un periodo cerrado.', 'warning');
      return;
    }
    if (this.authService.isLider() && estadoIngreso(item) === 'aprobado') {
      await this.mostrarToast('No puedes eliminar un ingreso ya aprobado.', 'warning');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el registro "${item.descripcion?.trim() || item.cuentaNombre?.trim() || 'sin descripción'}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await withLoading(this.loadingController, 'Eliminando registro...', async () => {
                await firstValueFrom(this.ingresosService.delete(item.id));
              });
              this.dataService.notifyChanges();
              await this.mostrarToast('Registro eliminado', 'warning');
            } catch (error) {
              await this.mostrarToast(error instanceof Error ? error.message : 'Error al eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  resetFormulario(): void {
    this.nuevoIngreso = INGRESO_VACIO();
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    this.modoEdicion = false;
    this.idEditando = null;
    this.intentoEnvio = false;
    this.aplicarAlcanceMinisterioAlFormulario();
    if (this.comprobanteInput?.nativeElement) {
      this.comprobanteInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const { dataUrl, tipo } = await procesarComprobante(file);
      this.nuevoIngreso = {
        ...this.nuevoIngreso,
        foto: dataUrl,
        comprobanteTipo: tipo
      };
    } catch (error) {
      await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo procesar el archivo.', 'danger');
      input.value = '';
    } finally {
      input.value = '';
      this.cdr.markForCheck();
    }
  }

  eliminarFoto(): void {
    this.nuevoIngreso = { ...this.nuevoIngreso, foto: '' };
    if (this.comprobanteInput?.nativeElement) {
      this.comprobanteInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

  cargarRelaciones(): void {
    this.listaMinisterios = this.dataService.getMinisteriosActuales();
    this.listaUsuarios = this.dataService.getUsuariosActuales();
    this.aplicarAlcanceMinisterioAlFormulario();
  }

  private aplicarResponsableAlFormulario(): void {
    this.nuevoIngreso = aplicarResponsableSesion(
      this.nuevoIngreso,
      this.authService.getSession(),
      this.listaUsuarios,
      this.modoEdicion
    );
  }

  private aplicarAlcanceMinisterioAlFormulario(): void {
    this.nuevoIngreso = aplicarMinisterioAlMovimiento(
      this.nuevoIngreso,
      this.listaMinisterios,
      this.ministerioScopeId
    );
    this.aplicarResponsableAlFormulario();
  }

  async mostrarToast(mensaje: string, color: string, duration = 2600): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color, duration);
  }

  onMinisterioIngresoChange(ministerioId: number | string | null | undefined): void {
    if (ministerioId == null || ministerioId === '') {
      this.nuevoIngreso.ministerioId = undefined;
      this.nuevoIngreso.ministerio = 'General';
      return;
    }
    const id = Number(ministerioId);
    const min = this.listaMinisterios.find(m => Number(m.id) === id);
    this.nuevoIngreso.ministerioId = id;
    if (min?.nombre) {
      this.nuevoIngreso.ministerio = min.nombre;
    }
  }

  onCuentaIngresoChange(codigo: string): void {
    aplicarCuentaEnIngreso(this.nuevoIngreso, codigo);
  }

  get esFormularioValido(): boolean {
    const monto = normalizarMontoFormulario(this.nuevoIngreso.monto);
    return esFormularioMovimientoValido({
      descripcion: this.nuevoIngreso.descripcion,
      monto,
      fechaManualForm: this.fechaManualForm,
      cuentaCodigo: this.nuevoIngreso.cuentaCodigo,
      ministerioId: this.nuevoIngreso.ministerioId,
      listaMinisteriosLength: this.listaMinisterios.length,
      ministerioScopeId: this.ministerioScopeId
    });
  }

  get mensajeValidacion(): string {
    const monto = normalizarMontoFormulario(this.nuevoIngreso.monto);
    return mensajeValidacionMovimiento({
      descripcion: this.nuevoIngreso.descripcion,
      monto,
      fechaManualForm: this.fechaManualForm,
      cuentaCodigo: this.nuevoIngreso.cuentaCodigo,
      ministerioId: this.nuevoIngreso.ministerioId,
      listaMinisteriosLength: this.listaMinisterios.length,
      ministerioScopeId: this.ministerioScopeId
    });
  }

  get editandoRechazado(): boolean {
    if (!this.modoEdicion || this.idEditando == null) return false;
    const item = this.listaIngresos.find(i => i.id === this.idEditando);
    return item ? estadoIngreso(item) === 'rechazado' : estadoIngreso(this.nuevoIngreso) === 'rechazado';
  }

  get motivoRechazoEdicion(): string | undefined {
    if (!this.modoEdicion || this.idEditando == null) return undefined;
    const item = this.listaIngresos.find(i => i.id === this.idEditando);
    return item?.motivoRechazo ?? this.nuevoIngreso.motivoRechazo;
  }
}
