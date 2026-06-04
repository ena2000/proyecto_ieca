import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
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
import { estadoGasto, etiquetaEstadoGasto, gastoPendiente } from '../../shared/utils/gasto.util';
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
  CUENTAS_GASTO_OPCIONES,
  cuentaGastoPorDefecto,
  etiquetaOpcionCuenta,
  resolverCuentaGastoLegacy
} from '../../shared/constants/contabilidad-cuentas.constants';
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
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
    IonIcon, IonItem, IonLabel, IonInput, IonButton, IonSearchbar,
    IonSelectOption, IonSelect,
    TablaGeneralComponent, NotificacionesBellComponent
  ],
  providers: [AlertController, ToastController, LoadingController]
})
export class GastosComponent implements OnInit, OnDestroy, ViewWillEnter {
  readonly isoToDateInputValue = isoToDateInputValue;

  @ViewChild('dateInputForm') dateInputForm?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputDesde') dateInputDesde?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputHasta') dateInputHasta?: ElementRef<HTMLInputElement>;

  fechaManualForm = '';
  listaMinisterios: Ministerio[] = [];
  listaUsuarios: Usuario[] = [];
  nuevoGasto: Gasto = GASTO_VACIO();
  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  listaGastos: Gasto[] = [];

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
    private loadingController: LoadingController,
    private dataService: DataService,
    private gastosService: GastosService,
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
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
    this.gastosService.gastos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => { this.listaGastos = list; });
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
    return this.cierreService.estaCerrado(this.nuevoGasto.fecha);
  }

  get etiquetaPeriodoFormulario(): string {
    return this.cierreService.etiquetaPeriodo(this.nuevoGasto.fecha);
  }

  movimientoEnPeriodoCerrado(item: Gasto): boolean {
    return this.cierreService.estaCerrado(item.fecha, item.cerrado);
  }

  get pendientesCount(): number {
    return this.listaGastos.filter(g => gastoPendiente(g)).length;
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
    this.fechaManualForm = formatearEntradaFechaManual(String(raw));
    const iso = isoDesdeFechaManualDDMMYYYY(this.fechaManualForm);
    if (iso) this.nuevoGasto.fecha = iso;
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
    if (upd.fechaIso) this.nuevoGasto.fecha = upd.fechaIso;
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

  get listaFiltrada(): Gasto[] {
    return filtrarMovimientos({
      items: this.listaGastos,
      ministerioScopeId: this.ministerioScopeId,
      filtros: this.filtros,
      textoBusqueda: g => [
        g.descripcion ?? '',
        g.cuentaNombre ?? g.categoria ?? '',
        g.cuentaCodigo ?? ''
      ],
      esPendiente: gastoPendiente,
      enriquecer: g => ({
        ...g,
        cuentaNombre: g.cuentaNombre || g.categoria || '—',
        estado: estadoGasto(g),
        estadoEtiqueta: etiquetaEstadoGasto(estadoGasto(g))
      })
    });
  }

  async registrarGasto(): Promise<void> {
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
    const preparado = this.gastosService.resolveRelations(
      this.normalizarGasto(),
      this.listaMinisterios,
      this.listaUsuarios
    );
    const guardando = this.modoEdicion ? 'Actualizando registro...' : 'Guardando gasto...';

    try {
      await withLoading(this.loadingController, guardando, async () => {
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
      });
      this.dataService.notifyChanges();
      this.resetFormulario();
    } catch (error) {
      await this.mostrarToast(
        mensajeErrorGuardadoMovimiento(
          error,
          'No se pudo guardar. Si adjuntaste un archivo muy grande, intenta sin comprobante.'
        ),
        'danger'
      );
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async aprobarGasto(item: Gasto): Promise<void> {
    if (!this.puedeAprobar || estadoGasto(item) !== 'pendiente') return;
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No se puede aprobar un gasto de un periodo cerrado.', 'warning');
      return;
    }
    try {
      await withLoading(this.loadingController, 'Aprobando gasto...', async () => {
        await firstValueFrom(this.gastosService.aprobar(item.id));
      });
      this.dataService.notifyChanges();
      await this.mostrarToast('Gasto aprobado', 'success');
    } catch (error) {
      await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo aprobar', 'danger');
    }
  }

  async rechazarGasto(item: Gasto): Promise<void> {
    if (!this.puedeAprobar || estadoGasto(item) !== 'pendiente') return;
    if (this.movimientoEnPeriodoCerrado(item)) {
      await this.mostrarToast('No se puede rechazar un gasto de un periodo cerrado.', 'warning');
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
            try {
              await withLoading(this.loadingController, 'Rechazando...', async () => {
                await firstValueFrom(this.gastosService.rechazar(item.id, data?.motivo));
              });
              this.dataService.notifyChanges();
              await this.mostrarToast('Gasto rechazado', 'warning');
            } catch (error) {
              await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo rechazar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarGasto(item: Gasto): Promise<void> {
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
                await firstValueFrom(this.gastosService.delete(item.id));
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
    this.nuevoGasto = GASTO_VACIO();
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoGasto.fecha);
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
      this.nuevoGasto.foto = dataUrl;
      this.nuevoGasto.comprobanteTipo = tipo;
    } catch (error) {
      await this.mostrarToast(error instanceof Error ? error.message : 'No se pudo procesar el archivo.', 'danger');
      input.value = '';
    }
  }

  eliminarFoto(): void {
    this.nuevoGasto.foto = '';
  }

  cargarRelaciones(): void {
    this.listaMinisterios = this.dataService.getMinisteriosActuales();
    this.listaUsuarios = this.dataService.getUsuariosActuales();
    this.aplicarAlcanceMinisterioAlFormulario();
  }

  private aplicarAlcanceMinisterioAlFormulario(): void {
    this.nuevoGasto = aplicarMinisterioAlMovimiento(
      this.nuevoGasto,
      this.listaMinisterios,
      this.ministerioScopeId
    );
  }

  async mostrarToast(mensaje: string, color: string): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color);
  }

  onCuentaGastoChange(codigo: string): void {
    aplicarCuentaEnGasto(this.nuevoGasto, codigo);
  }

  get esFormularioValido(): boolean {
    return esFormularioMovimientoValido({
      descripcion: this.nuevoGasto.descripcion,
      monto: this.nuevoGasto.monto,
      fechaManualForm: this.fechaManualForm,
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
