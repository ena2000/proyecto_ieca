import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { ViewWillEnter } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton,
  IonSearchbar, ToastController, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TablaGeneralComponent, TableColumn, TableActions } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { formatearISOaDDMMYYYY } from '../../shared/utils/date.util';
import { abrirSelectorFechaNativo, isoToDateInputValue } from '../../shared/utils/date-picker.util';
import { procesarComprobante, esComprobantePdf } from '../../shared/utils/comprobante-upload.util';
import { withLoading } from '../../shared/utils/loading.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { estadoIngreso, etiquetaEstadoIngreso, ingresoPendiente } from '../../shared/utils/ingreso.util';
import { registerMovimientoPageIcons } from '../../shared/utils/movimiento-page.icons';
import { filtrarMovimientos, hayFiltrosMovimientoActivos, FiltrosMovimiento } from '../../shared/utils/movimiento-filtros.util';
import {
  formatearEntradaFechaManual,
  isoDesdeFechaManualDDMMYYYY,
  actualizarDesdeFechaNativa,
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
import { resolverEstadoAlGuardar } from '../../shared/utils/movimiento-estado.util';
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
import { Ingreso, Ministerio, Usuario } from '../../core/models';
import { DataService } from '../../services/data.service';
import { IngresosService } from '../../services/ingresos.service';
import { AuthService } from '../../core/services/auth.service';
import { CierreService } from '../../core/services/cierre.service';

registerLocaleData(localeEs);

const INGRESO_VACIO = (): Ingreso => {
  const ingreso: Ingreso = {
    id: 0,
    fecha: new Date().toISOString(),
    descripcion: '',
    monto: null,
    foto: '',
    tipo: '',
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
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
    IonIcon, IonItem, IonLabel, IonInput, IonButton, IonSearchbar,
    IonSelectOption, IonSelect,
    TablaGeneralComponent, NotificacionesBellComponent
  ],
  providers: [AlertController, ToastController, LoadingController]
})
export class IngresosComponent implements OnInit, OnDestroy, ViewWillEnter {
  readonly isoToDateInputValue = isoToDateInputValue;

  @ViewChild('dateInputForm') dateInputForm?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputDesde') dateInputDesde?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputHasta') dateInputHasta?: ElementRef<HTMLInputElement>;

  fechaManualForm = '';
  listaMinisterios: Ministerio[] = [];
  listaUsuarios: Usuario[] = [];
  nuevoIngreso: Ingreso = INGRESO_VACIO();
  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  listaIngresos: Ingreso[] = [];

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
    private router: Router
  ) {
    registerMovimientoPageIcons();
  }

  ngOnInit(): void {
    void this.cierreService.cargar();
    this.inicializarPermisos();
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    this.ingresosService.ingresos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => { this.listaIngresos = list; });
    this.cargarRelaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    void this.cierreService.cargar();
    this.filtroSoloPendientes = leerFiltroPendientesDesdeRuta(
      this.route.snapshot.queryParamMap.get('pendientes')
    );
    this.dataService.refreshAllData();
    this.cargarRelaciones();
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

  get pendientesCount(): number {
    return this.listaIngresos.filter(i => ingresoPendiente(i)).length;
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
    const val = formatearEntradaFechaManual((event.target as HTMLInputElement).value);
    this.fechaManualForm = val;
    const iso = isoDesdeFechaManualDDMMYYYY(val);
    if (iso) this.nuevoIngreso.fecha = iso;
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
    if (!upd) return;
    if (upd.fechaIso) this.nuevoIngreso.fecha = upd.fechaIso;
    if (upd.fechaManualForm != null) this.fechaManualForm = upd.fechaManualForm;
    if (upd.fechaManualDesde != null) this.fechaManualDesde = upd.fechaManualDesde;
    if (upd.fechaManualHasta != null) this.fechaManualHasta = upd.fechaManualHasta;
    if (upd.filtroFechaInicio != null) this.filtroFechaInicio = upd.filtroFechaInicio;
    if (upd.filtroFechaFin != null) this.filtroFechaFin = upd.filtroFechaFin;
  }

  validarFechaManual(event: Event, tipo: 'desde' | 'hasta'): void {
    const val = formatearEntradaFechaManual((event.target as HTMLInputElement).value);
    if (tipo === 'desde') this.fechaManualDesde = val;
    else this.fechaManualHasta = val;
    const iso = isoDesdeFechaManualDDMMYYYY(val);
    if (!iso) return;
    if (tipo === 'desde') this.filtroFechaInicio = iso;
    else this.filtroFechaFin = iso;
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
    limpiarQueryPendientes(this.route, this.router);
  }

  get listaFiltrada(): Ingreso[] {
    return filtrarMovimientos({
      items: this.listaIngresos,
      ministerioScopeId: this.ministerioScopeId,
      filtros: this.filtros,
      textoBusqueda: i => [
        i.descripcion ?? '',
        i.cuentaNombre ?? i.tipo ?? '',
        i.cuentaCodigo ?? ''
      ],
      esPendiente: ingresoPendiente,
      enriquecer: i => ({
        ...i,
        cuentaNombre: i.cuentaNombre || i.tipo || '—',
        estado: estadoIngreso(i),
        estadoEtiqueta: etiquetaEstadoIngreso(estadoIngreso(i))
      })
    });
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
    this.intentoEnvio = true;
    if (this.periodoFormularioCerrado) {
      await this.mostrarToast(
        `El periodo ${this.etiquetaPeriodoFormulario} está cerrado. No se pueden registrar movimientos.`,
        'warning'
      );
      return;
    }
    this.aplicarAlcanceMinisterioAlFormulario();
    if (!this.esFormularioValido) {
      await this.mostrarToast(this.mensajeValidacion, 'danger');
      return;
    }

    this.cargarRelaciones();
    const fechaFormateada = this.fechaManualForm;
    const preparado = this.ingresosService.resolveRelations(
      this.normalizarIngreso(),
      this.listaMinisterios,
      this.listaUsuarios
    );
    const guardando = this.modoEdicion ? 'Actualizando registro...' : 'Guardando ingreso...';

    try {
      await withLoading(this.loadingController, guardando, async () => {
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
      });
      this.dataService.notifyChanges();
      this.resetFormulario();
    } catch (error) {
      await this.mostrarToast(
        mensajeErrorGuardadoMovimiento(error, 'Error al guardar el registro'),
        'danger'
      );
    }
  }

  async aprobarIngreso(item: Ingreso): Promise<void> {
    if (!this.puedeAprobar || estadoIngreso(item) !== 'pendiente') return;
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No se puede aprobar un ingreso de un periodo cerrado.', 'warning');
      return;
    }
    try {
      await withLoading(this.loadingController, 'Aprobando ingreso...', async () => {
        await firstValueFrom(this.ingresosService.aprobar(item.id));
      });
      this.dataService.notifyChanges();
      await this.mostrarToast('Ingreso aprobado', 'success');
    } catch (error) {
      await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo aprobar', 'danger');
    }
  }

  async rechazarIngreso(item: Ingreso): Promise<void> {
    if (!this.puedeAprobar || estadoIngreso(item) !== 'pendiente') return;
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
              await withLoading(this.loadingController, 'Rechazando...', async () => {
                await firstValueFrom(this.ingresosService.rechazar(item.id, data?.motivo));
              });
              this.dataService.notifyChanges();
              await this.mostrarToast('Ingreso rechazado', 'warning');
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
        const legacy = resolverCuentaIngresoLegacy(this.nuevoIngreso.tipo);
        aplicarCuentaEnIngreso(this.nuevoIngreso, legacy.codigo);
      }
      this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
      this.modoEdicion = true;
      this.idEditando = item.id;
      this.intentoEnvio = false;
      this.aplicarResponsableAlFormulario();
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
  }

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const { dataUrl, tipo } = await procesarComprobante(file);
      this.nuevoIngreso.foto = dataUrl;
      this.nuevoIngreso.comprobanteTipo = tipo;
    } catch (error) {
      await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo procesar el archivo.', 'danger');
      input.value = '';
    }
  }

  eliminarFoto(): void {
    this.nuevoIngreso.foto = '';
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

  async mostrarToast(mensaje: string, color: string): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color);
  }

  onCuentaIngresoChange(codigo: string): void {
    aplicarCuentaEnIngreso(this.nuevoIngreso, codigo);
  }

  get esFormularioValido(): boolean {
    return esFormularioMovimientoValido({
      descripcion: this.nuevoIngreso.descripcion,
      monto: this.nuevoIngreso.monto,
      fechaManualForm: this.fechaManualForm,
      cuentaCodigo: this.nuevoIngreso.cuentaCodigo,
      ministerioId: this.nuevoIngreso.ministerioId,
      listaMinisteriosLength: this.listaMinisterios.length,
      ministerioScopeId: this.ministerioScopeId
    });
  }

  get mensajeValidacion(): string {
    return mensajeValidacionMovimiento({
      descripcion: this.nuevoIngreso.descripcion,
      monto: this.nuevoIngreso.monto,
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
