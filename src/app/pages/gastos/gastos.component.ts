import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy,
  HostListener, ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import {
  IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton,
  IonSearchbar, ToastController, IonSelect, IonSelectOption, IonSpinner
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TablaGeneralComponent, TableColumn, TableActions } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from 'src/app/components/toolbar-menu-button/toolbar-menu-button.component';
import { formatearISOaDDMMYYYY } from '../../shared/utils/date.util';
import { abrirSelectorFechaNativo, isoToDateInputValue, resetNativosDateInputs } from '../../shared/utils/date-picker.util';
import { procesarComprobante, esComprobantePdf } from '../../shared/utils/comprobante-upload.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { estadoGasto, etiquetaEstadoGasto, gastoAprobado, gastoPendiente } from '../../shared/utils/gasto.util';
import { registerMovimientoPageIcons } from '../../shared/utils/movimiento-page.icons';
import { filtrarMovimientos, hayFiltrosMovimientoActivos, hayFiltrosMovimientoAvanzadosActivos, FiltrosMovimiento, FiltroEstadoMovimiento, itemsEnAlcanceMinisterio, normalizarFiltroMinisterioId } from '../../shared/utils/movimiento-filtros.util';
import {
  formatearEntradaFechaManual,
  isoDesdeFechaManualDDMMYYYY,
  actualizarDesdeFechaNativa,
  aplicarFechaManualFiltro,
  actualizarEstadoFiltroFechaMovimiento,
  CampoFechaMovimiento,
  hoyLocalYYYYMMDD,
  esFechaMovimientoFutura,
  fechaIsoHoyLocal,
  MENSAJE_FECHA_MOVIMIENTO_FUTURA
} from '../../shared/utils/movimiento-fecha.util';
import {
  leerValorIonInput,
  aplicarValoresTextoAlMovimiento,
  leerValorIonInputAsync,
  normalizarMontoFormulario,
  sincronizarFechaFormularioMovimiento,
  validarTamanoComprobante
} from '../../shared/utils/movimiento-form-sync.util';
import { FORM_GUARDADO_TOAST_MS, scrollAlErrorFormulario, refrescarListaTrasMutacion } from '../../shared/utils/form-guardado.util';
import { confirmarAccionDestructiva } from '../../shared/utils/confirmacion-alerta.util';
import { accionesTablaMovimiento } from '../../shared/utils/movimiento-acciones.util';
import {
  ministeriosEnAlcance,
  perteneceAlcanceMinisterio,
  aplicarMinisterioAlMovimiento,
  ministeriosParaFiltroListado
} from '../../shared/utils/movimiento-ministerio.util';
import { leerFiltroEstadoDesdeRuta, limpiarQueryPendientes, limpiarQueryIdRegistro } from '../../shared/utils/movimiento-query.util';
import { leerIdRegistroDesdeQuery } from '../../shared/utils/notificacion-ruta.util';
import { esFormularioMovimientoValido, mensajeValidacionMovimiento } from '../../shared/utils/movimiento-validacion.util';
import { estaPendienteParaAprobacion, resolverEstadoAlGuardar } from '../../shared/utils/movimiento-estado.util';
import {
  AccionFilaEnCurso,
  aplicarEstadoOptimistaEnLista,
  etiquetaAccionFilaEnCurso
} from '../../shared/utils/movimiento-accion.util';
import {
  abrirVisorComprobante,
  cerrarVisorComprobante,
  mensajeErrorGuardadoMovimiento
} from '../../shared/utils/movimiento-comprobante.util';
import {
  CUENTAS_GASTO_OPCIONES,
  cuentaGastoPorDefecto,
  etiquetaOpcionCuenta,
  resolverCuentaGastoLegacy
} from '../../shared/constants/contabilidad-cuentas.constants';
import { aplicarResponsableSesion, etiquetaResponsableMovimiento } from '../../shared/utils/movimiento-responsable.util';
import { aplicarCuentaEnGasto, inicializarCuentaGasto } from '../../shared/utils/contabilidad-cuenta-form.util';
import { Gasto, Ministerio, Usuario } from '../../core/models';
import { DataService } from '../../services/data.service';
import { GastosService } from '../../services/gastos.service';
import { AuthService } from '../../core/services/auth.service';
import { CierreService } from '../../core/services/cierre.service';

registerLocaleData(localeEs);

const GASTO_VACIO = (): Gasto => {
  const gasto: Gasto = {
    id: 0,
    fecha: fechaIsoHoyLocal(),
    descripcion: '',
    monto: null,
    foto: '',
    categoria: '',
    ministerio: 'General',
    ministerioId: undefined,
    usuarioId: undefined,
    registradoPor: 'Sistema'
  };
  inicializarCuentaGasto(gasto, cuentaGastoPorDefecto());
  return gasto;
};

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
    IonIcon, IonItem, IonLabel, IonInput, IonButton, IonSearchbar,
    IonSelectOption, IonSelect, IonSpinner,
    TablaGeneralComponent, NotificacionesBellComponent, ToolbarMenuButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.Default
})
export class GastosComponent implements OnInit, OnDestroy, ViewWillEnter {
  readonly isoToDateInputValue = isoToDateInputValue;
  readonly fechaMaximaInput = hoyLocalYYYYMMDD();

  @ViewChild('dateInputForm') dateInputForm?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputDesde') dateInputDesde?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputHasta') dateInputHasta?: ElementRef<HTMLInputElement>;
  @ViewChild('comprobanteInput') comprobanteInput?: ElementRef<HTMLInputElement>;
  @ViewChild('montoInput') montoInput?: IonInput;
  @ViewChild('descripcionInput') descripcionInput?: IonInput;
  @ViewChild('fechaInput') fechaInput?: ElementRef<HTMLInputElement>;
  @ViewChild(IonContent) private content?: IonContent;

  fechaManualForm = '';
  listaMinisterios: Ministerio[] = [];
  listaUsuarios: Usuario[] = [];
  nuevoGasto: Gasto = GASTO_VACIO();
  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  listaGastos: Gasto[] = [];
  listaFiltradaVista: Gasto[] = [];
  pendientesCount = 0;
  aprobadosCount = 0;
  rechazadosCount = 0;

  private destroy$ = new Subject<void>();

  searchTerm = '';
  fechaManualDesde = '';
  fechaManualHasta = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';
  filtroMontoMin: number | null = null;
  filtroMontoMax: number | null = null;
  filtroEstado: FiltroEstadoMovimiento = 'todos';
  filtroMinisterioId: number | null = null;
  mostrarFiltrosAvanzados = false;

  comprobanteSeleccionado: string | null = null;
  comprobanteEsPdf = false;
  registrando = false;
  formGuardadoError: string | null = null;
  accionFilaEnCurso: AccionFilaEnCurso | null = null;
  highlightRowId: number | string | null = null;
  private highlightClearTimer: ReturnType<typeof setTimeout> | null = null;
  readonly etiquetaAccionFilaEnCurso = etiquetaAccionFilaEnCurso;

  readonly cuentasGasto = CUENTAS_GASTO_OPCIONES;
  readonly etiquetaOpcionCuenta = etiquetaOpcionCuenta;
  columnsGastos: TableColumn[] = [
    { field: 'foto', header: 'Comprobante', type: 'evidence' },
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'estadoEtiqueta', header: 'Estado', type: 'badge' },
    { field: 'cuentaNombre', header: 'Cuenta', type: 'badge' },
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
    private dataService: DataService,
    private gastosService: GastosService,
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
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.gastosService.gastos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.listaGastos = list;
        this.actualizarVista();
        this.intentarEnfocarRegistroDesdeRuta();
      });
    this.dataService.dataRevision$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarVista());
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.intentarEnfocarRegistroDesdeRuta());
    void this.inicializarDatos();
  }

  private async inicializarDatos(): Promise<void> {
    if (!this.dataService.hasRemoteData()) {
      await this.dataService.bootstrapRemote();
    }
    this.cargarRelaciones();
    this.actualizarVista();
    this.intentarEnfocarRegistroDesdeRuta();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.highlightClearTimer) {
      clearTimeout(this.highlightClearTimer);
      this.highlightClearTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    void this.cierreService.cargar();
    this.filtroEstado = leerFiltroEstadoDesdeRuta(
      this.route.snapshot.queryParamMap.get('pendientes')
    );
    if (!this.dataService.hasRemoteData()) {
      void this.dataService.bootstrapRemote().then(() => {
        this.cargarRelaciones();
        this.actualizarVista();
        this.intentarEnfocarRegistroDesdeRuta();
      });
    } else {
      this.cargarRelaciones();
      this.actualizarVista();
      this.intentarEnfocarRegistroDesdeRuta();
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
      filtroEstado: this.filtroEstado,
      filtroMinisterioId: this.filtroMinisterioId
    };
  }

  get puedeFiltrarPorMinisterio(): boolean {
    return this.ministerioScopeId == null;
  }

  get ministeriosParaFiltro(): Ministerio[] {
    return ministeriosParaFiltroListado(this.listaMinisterios, this.ministerioScopeId);
  }

  get hayFiltrosAvanzadosActivos(): boolean {
    return hayFiltrosMovimientoAvanzadosActivos(this.filtros);
  }

  get periodoFormularioCerrado(): boolean {
    return this.cierreService.estaCerrado(this.nuevoGasto.fecha);
  }

  get etiquetaPeriodoFormulario(): string {
    return this.cierreService.etiquetaPeriodo(this.nuevoGasto.fecha);
  }

  movimientoEnPeriodoCerrado(item: Gasto): boolean {
    return this.cierreService.estaCerrado(item.fecha, item.cerrado);
  }

  onFiltrosChange(): void {
    this.actualizarVista();
  }

  seleccionarFiltroEstado(estado: FiltroEstadoMovimiento): void {
    this.filtroEstado = estado;
    this.onFiltrosChange();
  }

  alternarFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  onFiltroMinisterioChange(): void {
    this.filtroMinisterioId = normalizarFiltroMinisterioId(this.filtroMinisterioId);
    this.onFiltrosChange();
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
    return esComprobantePdf(this.nuevoGasto.foto);
  }

  validarFechaManualForm(event: CustomEvent | Event): void {
    const raw = (event as CustomEvent).detail?.value
      ?? (event.target as HTMLInputElement)?.value
      ?? this.fechaManualForm
      ?? '';
    this.onFechaManualFormChange(String(raw));
  }

  onFechaManualFormChange(raw: string | null | undefined): void {
    const val = formatearEntradaFechaManual(String(raw ?? ''));
    this.fechaManualForm = val;
    const el = this.fechaInput?.nativeElement;
    if (el && el.value !== val) {
      el.value = val;
    }
    const iso = isoDesdeFechaManualDDMMYYYY(val);
    if (iso) this.nuevoGasto.fecha = iso;
    this.cdr.markForCheck();
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
        this.nuevoGasto.fecha = upd.fechaIso || fechaIsoHoyLocal();
      }
      if (upd.fechaManualForm != null) {
        this.fechaManualForm = upd.fechaManualForm;
        if (this.fechaInput?.nativeElement) {
          this.fechaInput.nativeElement.value = upd.fechaManualForm;
        }
      }
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
      this.nuevoGasto,
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
    this.filtroEstado = 'todos';
    this.filtroMinisterioId = null;
    this.mostrarFiltrosAvanzados = false;
    resetNativosDateInputs([
      this.dateInputDesde?.nativeElement,
      this.dateInputHasta?.nativeElement
    ]);
    limpiarQueryPendientes(this.route, this.router);
    this.actualizarVista();
    this.cdr.markForCheck();
  }

  /** Abre/resalta el gasto indicado en `?id=` (desde notificaciones). */
  private intentarEnfocarRegistroDesdeRuta(): void {
    const id = leerIdRegistroDesdeQuery(this.route.snapshot.queryParamMap.get('id'));
    if (!id) return;
    if (!this.listaGastos.length && !this.dataService.hasRemoteData()) return;

    const item = this.listaGastos.find(g => String(g.id) === id);
    if (!item) {
      if (this.listaGastos.length > 0) {
        void this.mostrarToast('Ese gasto ya no está disponible.', 'warning');
        limpiarQueryIdRegistro(this.route, this.router);
      }
      return;
    }

    this.searchTerm = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.fechaManualDesde = '';
    this.fechaManualHasta = '';
    this.filtroMontoMin = null;
    this.filtroMontoMax = null;
    this.filtroEstado = 'todos';
    this.filtroMinisterioId = null;
    this.mostrarFiltrosAvanzados = false;
    this.highlightRowId = item.id ?? id;
    this.actualizarVista();
    limpiarQueryIdRegistro(this.route, this.router);

    if (this.highlightClearTimer) clearTimeout(this.highlightClearTimer);
    this.highlightClearTimer = setTimeout(() => {
      this.highlightRowId = null;
      this.highlightClearTimer = null;
      this.cdr.markForCheck();
    }, 4500);
    this.cdr.markForCheck();
  }

  private actualizarVista(): void {
    this.listaFiltradaVista = filtrarMovimientos({
      items: this.listaGastos,
      ministerioScopeId: this.ministerioScopeId,
      filtros: this.filtros,
      textoBusqueda: g => [
        g.descripcion ?? '',
        g.cuentaNombre ?? g.categoria ?? '',
        g.cuentaCodigo ?? ''
      ],
      resolverEstado: g => estadoGasto(g),
      enriquecer: g => ({
        ...g,
        cuentaNombre: g.cuentaNombre || g.categoria || '—',
        estado: estadoGasto(g),
        estadoEtiqueta: etiquetaEstadoGasto(estadoGasto(g))
      })
    });
    const enAlcance = itemsEnAlcanceMinisterio(
      this.listaGastos,
      this.ministerioScopeId,
      this.filtroMinisterioId
    );
    this.pendientesCount = enAlcance.filter(gastoPendiente).length;
    this.aprobadosCount = enAlcance.filter(gastoAprobado).length;
    this.rechazadosCount = enAlcance.filter(g => estadoGasto(g) === 'rechazado').length;
    this.cdr.markForCheck();
  }

  async registrarGasto(): Promise<void> {
    if (this.registrando) return;
    this.registrando = true;
    this.cdr.markForCheck();

    this.intentoEnvio = true;
    this.formGuardadoError = null;
    try {
      await this.sincronizarFormularioAntesDeGuardar();
      this.aplicarAlcanceMinisterioAlFormulario();
      this.cdr.markForCheck();

      if (esFechaMovimientoFutura(this.fechaManualForm, this.nuevoGasto.fecha)) {
        this.formGuardadoError = MENSAJE_FECHA_MOVIMIENTO_FUTURA;
        this.cdr.markForCheck();
        await this.mostrarToast(this.formGuardadoError, 'warning');
        return;
      }

      if (this.periodoFormularioCerrado) {
        this.formGuardadoError =
          `El periodo ${this.etiquetaPeriodoFormulario} está cerrado. No se pueden registrar movimientos.`;
        this.cdr.markForCheck();
        await this.mostrarToast(this.formGuardadoError, 'warning');
        return;
      }

      const comprobanteErr = validarTamanoComprobante(this.nuevoGasto.foto);
      if (comprobanteErr) {
        this.formGuardadoError = comprobanteErr;
        this.cdr.markForCheck();
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
      const preparado = this.gastosService.resolveRelations(
        this.normalizarGasto(),
        this.listaMinisterios,
        this.listaUsuarios
      );

      if (this.modoEdicion && this.idEditando !== null) {
        await firstValueFrom(this.gastosService.update(this.idEditando, preparado, fechaFormateada));
        const msg = this.authService.isLider()
          ? 'Gasto actualizado y enviado a aprobación'
          : 'Registro actualizado exitosamente';
        await this.mostrarToast(msg, 'success');
      } else {
        await firstValueFrom(this.gastosService.create(preparado, fechaFormateada));
        const msg = this.authService.isLider()
          ? 'Gasto registrado. Queda pendiente de aprobación.'
          : 'Registro creado exitosamente';
        await this.mostrarToast(msg, 'success');
      }
      refrescarListaTrasMutacion(
        () => this.gastosService.getAll(),
        lista => { this.listaGastos = lista; },
        () => this.actualizarVista()
      );
      this.dataService.notifyChanges();
      this.resetFormulario();
      this.scrollAlHistorial();
    } catch (error) {
      this.formGuardadoError = mensajeErrorGuardadoMovimiento(
        error,
        'No se pudo guardar. Si adjuntaste un archivo muy grande, intenta sin comprobante.'
      );
      await this.mostrarToast(this.formGuardadoError, 'danger', FORM_GUARDADO_TOAST_MS);
      scrollAlErrorFormulario();
    } finally {
      this.registrando = false;
      this.cdr.markForCheck();
    }
  }

  private scrollAlHistorial(): void {
    requestAnimationFrame(() => {
      document.querySelector('.list-container')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  private async sincronizarFormularioAntesDeGuardar(): Promise<void> {
    const [montoRaw, descripcionRaw] = await Promise.all([
      leerValorIonInputAsync(this.montoInput),
      leerValorIonInputAsync(this.descripcionInput)
    ]);
    const fechaRaw = this.fechaInput?.nativeElement?.value ?? this.fechaManualForm;

    this.nuevoGasto = aplicarValoresTextoAlMovimiento(
      this.nuevoGasto,
      montoRaw,
      descripcionRaw
    );

    if (fechaRaw.trim()) {
      this.fechaManualForm = formatearEntradaFechaManual(fechaRaw);
    }

    const monto = normalizarMontoFormulario(this.nuevoGasto.monto);
    if (monto != null) {
      this.nuevoGasto = { ...this.nuevoGasto, monto };
    }

    const syncFecha = sincronizarFechaFormularioMovimiento(
      this.fechaManualForm,
      this.nuevoGasto.fecha
    );
    this.fechaManualForm = syncFecha.fechaManualForm;
    if (syncFecha.fechaIso) {
      this.nuevoGasto = { ...this.nuevoGasto, fecha: syncFecha.fechaIso };
    }

    if (this.nuevoGasto.cuentaCodigo?.trim()) {
      aplicarCuentaEnGasto(this.nuevoGasto, this.nuevoGasto.cuentaCodigo);
    }
  }

  private normalizarGasto(): Gasto {
    const monto = Number(this.nuevoGasto.monto);
    const estado = resolverEstadoAlGuardar({
      esLider: this.authService.isLider(),
      modoEdicion: this.modoEdicion,
      idEditando: this.idEditando,
      lista: this.listaGastos,
      estadoAprobado: 'aprobado',
      estadoPendiente: 'pendiente',
      leerEstado: estadoGasto
    });

    return {
      ...this.nuevoGasto,
      monto: Number.isFinite(monto) ? monto : null,
      ministerioId: this.nuevoGasto.ministerioId != null ? Number(this.nuevoGasto.ministerioId) : undefined,
      usuarioId: this.nuevoGasto.usuarioId != null ? Number(this.nuevoGasto.usuarioId) : undefined,
      estado,
      motivoRechazo: estado === 'pendiente' ? undefined : this.nuevoGasto.motivoRechazo
    };
  }

  editarGasto(item: Gasto): void {
    if (!perteneceAlcanceMinisterio(item, this.ministerioScopeId)) {
      void this.mostrarToast('No puedes editar registros de otro ministerio.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      void this.mostrarToast('No puedes editar gastos de un periodo cerrado.', 'warning');
      return;
    }
    if (this.authService.isLider() && estadoGasto(item) === 'aprobado') {
      void this.mostrarToast('No puedes editar un gasto ya aprobado.', 'warning');
      return;
    }
    this.nuevoGasto.foto = '';
    setTimeout(() => {
      this.nuevoGasto = { ...item };
      if (!this.nuevoGasto.cuentaCodigo) {
        const legacy = resolverCuentaGastoLegacy(this.nuevoGasto.categoria);
        aplicarCuentaEnGasto(this.nuevoGasto, legacy.codigo);
      }
      this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
      this.modoEdicion = true;
      this.idEditando = item.id;
      this.intentoEnvio = false;
      this.aplicarResponsableAlFormulario();
      this.cdr.markForCheck();
      void this.content?.scrollToTop(300);
    }, 50);
  }

  async aprobarGasto(item: Gasto): Promise<void> {
    if (this.accionFilaEnCurso) return;
    if (!this.puedeAprobar) {
      await this.mostrarToast('Solo el administrador puede aprobar gastos.', 'warning');
      return;
    }
    if (!estaPendienteParaAprobacion(item)) {
      await this.mostrarToast('Este gasto ya no está pendiente de aprobación.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No se puede aprobar un gasto de un periodo cerrado.', 'warning');
      return;
    }
    const id = Number(item.id);
    if (!Number.isFinite(id)) {
      await this.mostrarToast('No se pudo identificar el gasto.', 'danger');
      return;
    }

    const listaAntes = [...this.listaGastos];
    this.accionFilaEnCurso = { id, tipo: 'aprobar' };
    this.listaGastos = aplicarEstadoOptimistaEnLista(
      this.listaGastos,
      id,
      'aprobado',
      etiquetaEstadoGasto('aprobado')
    );
    this.actualizarVista();
    this.cdr.markForCheck();

    try {
      await firstValueFrom(this.gastosService.aprobar(id));
      refrescarListaTrasMutacion(
        () => this.gastosService.getAll(),
        lista => { this.listaGastos = lista; },
        () => this.actualizarVista()
      );
      this.dataService.notifyChanges();
      await this.mostrarToast('Gasto aprobado', 'success');
    } catch (error) {
      this.listaGastos = listaAntes;
      this.actualizarVista();
      await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo aprobar', 'danger');
    } finally {
      this.accionFilaEnCurso = null;
      this.cdr.markForCheck();
    }
  }

  async rechazarGasto(item: Gasto): Promise<void> {
    if (this.accionFilaEnCurso) return;
    if (!this.puedeAprobar) {
      await this.mostrarToast('Solo el administrador puede rechazar gastos.', 'warning');
      return;
    }
    if (!estaPendienteParaAprobacion(item)) {
      await this.mostrarToast('Este gasto ya no está pendiente de aprobación.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No se puede rechazar un gasto de un periodo cerrado.', 'warning');
      return;
    }
    const id = Number(item.id);
    if (!Number.isFinite(id)) {
      await this.mostrarToast('No se pudo identificar el gasto.', 'danger');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Rechazar gasto',
      message: 'Indica el motivo del rechazo (opcional).',
      inputs: [{ name: 'motivo', type: 'textarea', placeholder: 'Motivo...' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: async (data) => {
            const listaAntes = [...this.listaGastos];
            this.accionFilaEnCurso = { id, tipo: 'rechazar' };
            this.listaGastos = aplicarEstadoOptimistaEnLista(
              this.listaGastos,
              id,
              'rechazado',
              etiquetaEstadoGasto('rechazado')
            );
            this.actualizarVista();
            this.cdr.markForCheck();
            try {
              await firstValueFrom(this.gastosService.rechazar(id, data?.motivo));
              refrescarListaTrasMutacion(
                () => this.gastosService.getAll(),
                lista => { this.listaGastos = lista; },
                () => this.actualizarVista()
              );
              this.dataService.notifyChanges();
              await this.mostrarToast('Gasto rechazado', 'warning');
            } catch (error) {
              this.listaGastos = listaAntes;
              this.actualizarVista();
              await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo rechazar', 'danger');
            } finally {
              this.accionFilaEnCurso = null;
              this.cdr.markForCheck();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarGasto(item: Gasto): Promise<void> {
    if (this.accionFilaEnCurso) return;
    if (!perteneceAlcanceMinisterio(item, this.ministerioScopeId)) {
      await this.mostrarToast('No puedes eliminar registros de otro ministerio.', 'warning');
      return;
    }
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No puedes eliminar gastos de un periodo cerrado.', 'warning');
      return;
    }
    if (this.authService.isLider() && estadoGasto(item) === 'aprobado') {
      await this.mostrarToast('No puedes eliminar un gasto ya aprobado.', 'warning');
      return;
    }
    const id = Number(item.id);
    if (!Number.isFinite(id)) {
      await this.mostrarToast('No se pudo identificar el registro.', 'danger');
      return;
    }
    const confirmado = await confirmarAccionDestructiva(this.alertController, {
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el registro "${item.descripcion?.trim() || item.cuentaNombre?.trim() || 'sin descripción'}"?`
    });
    if (!confirmado) return;

    const listaAntes = [...this.listaGastos];
    this.accionFilaEnCurso = { id, tipo: 'eliminar' };
    this.cdr.markForCheck();

    try {
      await firstValueFrom(this.gastosService.delete(id));
      refrescarListaTrasMutacion(
        () => this.gastosService.getAll(),
        lista => { this.listaGastos = lista; },
        () => this.actualizarVista()
      );
      this.dataService.notifyChanges();
      await this.mostrarToast('Registro eliminado', 'warning');
    } catch (error) {
      this.listaGastos = listaAntes;
      this.actualizarVista();
      await this.mostrarToast(error instanceof Error ? error.message : 'Error al eliminar', 'danger');
    } finally {
      this.accionFilaEnCurso = null;
      this.cdr.markForCheck();
    }
  }

  resetFormulario(): void {
    this.nuevoGasto = GASTO_VACIO();
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.modoEdicion = false;
    this.idEditando = null;
    this.intentoEnvio = false;
    this.formGuardadoError = null;
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
      this.nuevoGasto = {
        ...this.nuevoGasto,
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
    this.nuevoGasto = { ...this.nuevoGasto, foto: '' };
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
    this.nuevoGasto = aplicarResponsableSesion(
      this.nuevoGasto,
      this.authService.getSession(),
      this.listaUsuarios,
      this.modoEdicion
    );
  }

  private aplicarAlcanceMinisterioAlFormulario(): void {
    this.nuevoGasto = aplicarMinisterioAlMovimiento(
      this.nuevoGasto,
      this.listaMinisterios,
      this.ministerioScopeId
    );
    this.aplicarResponsableAlFormulario();
  }

  async mostrarToast(mensaje: string, color: string, duration = 2600): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color, duration);
  }

  onCuentaGastoChange(codigo: string): void {
    aplicarCuentaEnGasto(this.nuevoGasto, codigo);
  }

  onMinisterioGastoChange(ministerioId: number | string | null | undefined): void {
    if (ministerioId == null || ministerioId === '') {
      this.nuevoGasto.ministerioId = undefined;
      this.nuevoGasto.ministerio = 'General';
      return;
    }
    const id = Number(ministerioId);
    const min = this.listaMinisterios.find(m => Number(m.id) === id);
    this.nuevoGasto.ministerioId = id;
    if (min?.nombre) {
      this.nuevoGasto.ministerio = min.nombre;
    }
  }

  get esFormularioValido(): boolean {
    return esFormularioMovimientoValido({
      descripcion: this.nuevoGasto.descripcion,
      monto: this.nuevoGasto.monto,
      fechaManualForm: this.fechaManualForm,
      fechaIso: this.nuevoGasto.fecha,
      cuentaCodigo: this.nuevoGasto.cuentaCodigo,
      ministerioId: this.nuevoGasto.ministerioId,
      listaMinisteriosLength: this.listaMinisterios.length,
      ministerioScopeId: this.ministerioScopeId
    });
  }

  get mensajeValidacion(): string {
    return mensajeValidacionMovimiento({
      descripcion: this.nuevoGasto.descripcion,
      monto: this.nuevoGasto.monto,
      fechaManualForm: this.fechaManualForm,
      fechaIso: this.nuevoGasto.fecha,
      cuentaCodigo: this.nuevoGasto.cuentaCodigo,
      ministerioId: this.nuevoGasto.ministerioId,
      listaMinisteriosLength: this.listaMinisterios.length,
      ministerioScopeId: this.ministerioScopeId
    });
  }

  get editandoRechazado(): boolean {
    if (!this.modoEdicion || this.idEditando == null) return false;
    const item = this.listaGastos.find(g => g.id === this.idEditando);
    return item ? estadoGasto(item) === 'rechazado' : estadoGasto(this.nuevoGasto) === 'rechazado';
  }

  get motivoRechazoEdicion(): string | undefined {
    if (!this.modoEdicion || this.idEditando == null) return undefined;
    const item = this.listaGastos.find(g => g.id === this.idEditando);
    return item?.motivoRechazo ?? this.nuevoGasto.motivoRechazo;
  }
}
