import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import {
  IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
  IonIcon, ToastController, IonLabel, IonItem,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from 'src/app/components/toolbar-menu-button/toolbar-menu-button.component';
import {
  DesgloseMinisterioReporte, DesgloseReporte, KardexLinea, Ministerio, Reporte
} from '../../core/models';
import { DataService } from '../../services/data.service';
import { ReportesService } from '../../services/reportes.service';
import { AuthService } from '../../core/services/auth.service';
import { etiquetaParaMes, nombreMesDesdeValor } from '../../shared/utils/month.util';
import { formatearMoneda } from '../../shared/utils/currency.util';
import { registerReportesPageIcons } from '../../shared/utils/reportes-page.icons';
import {
  FiltroMovimientoReporte,
  PeriodoPresetReporte,
  filtrarReportes,
  hayFiltrosReporteActivos,
  resolverFiltroMesPorPreset,
  mesesDisponiblesDesdeReportes,
  aniosDisponiblesDesdeReportes,
  mesesDelAnioParaReporte,
  anioDesdeFiltroMes,
  componerFiltroMesAnio,
  etiquetaFiltroMovimientoReporte,
  construirEtiquetaFiltroReporte
} from '../../shared/utils/reportes-filtros.util';
import { aIdNumericoONull, mismoIdNumerico } from '../../shared/utils/id-coerce.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { esMinisterioIglesiaGeneral } from '../../shared/constants/ministerios-catalogo.constants';

export type { FiltroMovimientoReporte } from '../../shared/utils/reportes-filtros.util';

registerLocaleData(localeEs);
registerReportesPageIcons();

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
    IonIcon, IonLabel, IonItem, IonSelect, IonSelectOption,
    NotificacionesBellComponent, ToolbarMenuButtonComponent
  ],
  providers: [ToastController],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesComponent implements OnInit, OnDestroy, ViewWillEnter {
  readonly formatearMoneda = formatearMoneda;
  readonly esMinisterioIglesiaGeneral = esMinisterioIglesiaGeneral;
  readonly mismoIdMinisterio = mismoIdNumerico;

  listaReportes: Reporte[] = [];
  listaMinisterios: Pick<Ministerio, 'id' | 'nombre'>[] = [];
  listaFiltradaVista: Reporte[] = [];
  mesesDisponibles: { value: string; label: string }[] = [];
  aniosDisponibles: string[] = [];
  mesesDelAnio: { value: string; label: string }[] = [];
  filtroAnio = String(new Date().getFullYear());
  desgloseAgregado: DesgloseReporte[] = [];
  desgloseMinisterioVista: DesgloseMinisterioReporte[] = [];
  lineasKardexVista: KardexLinea[] = [];
  nombreMinisterioKardex = '';
  saldoDisponibleMinisterio = 0;
  totalIngresosFiltrado = 0;
  totalGastosFiltrado = 0;
  totalSaldoFiltrado = 0;
  mostrarDesgloseMinisterio = false;
  esAdministrador = false;
  totalAportacionPeriodo = 0;
  totalAportacionHistorica = 0;

  searchTerm = '';
  filtroMes = '';
  filtroMinisterioId: number | null = null;
  filtroMovimiento: FiltroMovimientoReporte = 'todos';
  periodoPreset: PeriodoPresetReporte = 'este_mes';
  ministerioScopeId: number | null = null;
  filtroMinisterioBloqueado = false;

  private destroy$ = new Subject<void>();

  constructor(
    private toastController: ToastController,
    private dataService: DataService,
    private reportesService: ReportesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.esAdministrador = this.authService.isAdministrador();
    this.ministerioScopeId = this.authService.getMinisterioScopeId();
    if (this.ministerioScopeId != null) {
      this.filtroMinisterioId = this.ministerioScopeId;
      this.filtroMinisterioBloqueado = true;
    }
    this.setPeriodo('este_mes');
    combineLatest([this.dataService.ingresos$, this.dataService.gastos$])
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => this.actualizarVista());
    this.dataService.dataRevision$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarVista());
    void this.inicializarDatos();
  }

  private async inicializarDatos(): Promise<void> {
    if (!this.dataService.hasRemoteData()) {
      await this.dataService.bootstrapRemote();
    }
    this.actualizarVista();
  }

  ionViewWillEnter(): void {
    if (!this.dataService.hasRemoteData()) {
      void this.dataService.bootstrapRemote().then(() => this.actualizarVista());
      return;
    }
    this.actualizarVista();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private actualizarVista(): void {
    this.listaMinisterios = this.dataService.getMinisteriosParaReportes().map(m => ({
      id: m.id,
      nombre: m.nombre
    }));
    this.listaReportes = this.reportesService.generarReportes();
    this.mesesDisponibles = mesesDisponiblesDesdeReportes(
      this.listaReportes,
      this.filtroMes || null
    );
    this.sincronizarSelectoresPeriodo();
    this.listaFiltradaVista = filtrarReportes(this.listaReportes, this.filtrosReporte);
    this.totalIngresosFiltrado = this.listaFiltradaVista.reduce(
      (sum, r) => sum + (r.ingresos || 0), 0
    );
    this.totalGastosFiltrado = this.listaFiltradaVista.reduce(
      (sum, r) => sum + (r.gastos || 0), 0
    );
    this.totalSaldoFiltrado = this.totalIngresosFiltrado - this.totalGastosFiltrado;
    this.desgloseAgregado = this.reportesService.calcularDesglose(this.listaFiltradaVista);
    const ministerioDesgloseId = this.filtroMinisterioId ?? this.ministerioScopeId ?? null;
    this.desgloseMinisterioVista = this.reportesService.calcularDesglosePorMinisterio(
      this.listaFiltradaVista,
      this.listaMinisterios,
      ministerioDesgloseId,
      {
        mesPeriodo: this.filtroMes || null,
        incluirAportacion: this.esAdministrador
      }
    );
    this.mostrarDesgloseMinisterio = this.desgloseMinisterioVista.length > 0;
    this.totalAportacionPeriodo = this.desgloseMinisterioVista.reduce(
      (sum, row) => sum + (row.aportacionPeriodo || 0), 0
    );
    this.totalAportacionHistorica = this.desgloseMinisterioVista.reduce(
      (sum, row) => sum + (row.aportacionHistorica || 0), 0
    );
    if (this.filtroMinisterioId != null) {
      this.nombreMinisterioKardex = this.listaMinisterios.find(
        m => Number(m.id) === Number(this.filtroMinisterioId)
      )?.nombre ?? 'Ministerio';
      this.lineasKardexVista = [
        ...this.dataService.getKardexMinisterio(this.filtroMinisterioId)
      ].reverse();
      this.saldoDisponibleMinisterio = this.dataService.calcularSaldoMinisterio(
        this.filtroMinisterioId
      );
    } else {
      this.nombreMinisterioKardex = '';
      this.lineasKardexVista = [];
      this.saldoDisponibleMinisterio = 0;
    }
    this.cdr.markForCheck();
  }

  private get filtrosReporte() {
    return {
      searchTerm: this.searchTerm,
      filtroMes: this.filtroMes,
      filtroMinisterioId: this.filtroMinisterioId,
      filtroMovimiento: this.filtroMovimiento,
      periodoPreset: this.periodoPreset,
      ministerioScopeId: this.ministerioScopeId
    };
  }

  setFiltroMovimiento(tipo: FiltroMovimientoReporte): void {
    this.filtroMovimiento = tipo;
    this.actualizarVista();
  }

  get etiquetaMesActivo(): string {
    return this.filtroMes ? etiquetaParaMes(this.filtroMes) : 'Todo el historial';
  }

  get etiquetaMesCorto(): string {
    return this.filtroMes ? nombreMesDesdeValor(this.filtroMes) : '';
  }

  /** Etiqueta corta para títulos y totales del bloque “período”. */
  get etiquetaPeriodoResumen(): string {
    return this.etiquetaMesActivo;
  }

  get hayFiltrosActivos(): boolean {
    return hayFiltrosReporteActivos(this.filtrosReporte);
  }

  get hayFiltrosActivosExportacion(): boolean {
    return this.hayFiltrosActivos;
  }

  private sincronizarSelectoresPeriodo(): void {
    this.aniosDisponibles = aniosDisponiblesDesdeReportes(
      this.listaReportes,
      this.filtroMes || null
    ).map(String);
    if (this.filtroMes) {
      this.filtroAnio = String(anioDesdeFiltroMes(this.filtroMes));
      this.mesesDelAnio = mesesDelAnioParaReporte(Number(this.filtroAnio));
    } else {
      this.filtroAnio = String(new Date().getFullYear());
      this.mesesDelAnio = mesesDelAnioParaReporte(Number(this.filtroAnio));
    }
  }

  setPeriodo(preset: PeriodoPresetReporte): void {
    this.periodoPreset = preset;
    this.filtroMes = resolverFiltroMesPorPreset(preset);
    this.actualizarVista();
  }

  onAnioCambio(): void {
    const mesActual = Number(this.filtroMes?.slice(5, 7)) || 1;
    this.filtroMes = componerFiltroMesAnio(Number(this.filtroAnio), mesActual);
    this.periodoPreset = 'custom';
    this.actualizarVista();
  }

  onMesCambio(): void {
    this.periodoPreset = 'custom';
    this.actualizarVista();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroMovimiento = 'todos';
    if (!this.filtroMinisterioBloqueado) {
      this.filtroMinisterioId = null;
    }
    this.periodoPreset = 'este_mes';
    this.filtroMes = resolverFiltroMesPorPreset('este_mes');
    this.actualizarVista();
  }

  onFiltroMinisterioChange(): void {
    this.filtroMinisterioId = aIdNumericoONull(this.filtroMinisterioId);
    this.actualizarVista();
  }

  get etiquetaFiltroMovimiento(): string {
    return etiquetaFiltroMovimientoReporte(this.filtroMovimiento);
  }

  get mostrarKardexMinisterio(): boolean {
    return this.filtroMinisterioId != null;
  }

  seleccionarMinisterioParaKardex(ministerioId: number): void {
    if (this.filtroMinisterioBloqueado) return;
    this.filtroMinisterioId = aIdNumericoONull(ministerioId);
    this.actualizarVista();
  }

  limpiarSeleccionMinisterio(): void {
    if (this.filtroMinisterioBloqueado) return;
    this.filtroMinisterioId = null;
    this.actualizarVista();
  }

  exportarExcel(): void {
    const reportes = this.listaFiltradaVista;
    if (reportes.length === 0) {
      void this.mostrarToast('No hay registros para exportar.', 'warning');
      return;
    }

    const fecha = new Date().toISOString().slice(0, 10);
    const sufijo =
      this.filtroMovimiento === 'ingresos' ? '_ingresos' :
      this.filtroMovimiento === 'gastos' ? '_gastos' : '';

    const saldosMinisterio = this.reportesService.construirSaldosMinisterio(
      this.listaMinisterios,
      this.ministerioScopeId
    );

    let kardex: KardexLinea[] | undefined;
    let nombreMinisterioKardex: string | undefined;
    if (this.filtroMinisterioId != null) {
      kardex = this.dataService.getKardexMinisterio(this.filtroMinisterioId);
      nombreMinisterioKardex = this.listaMinisterios.find(
        m => Number(m.id) === Number(this.filtroMinisterioId)
      )?.nombre;
    }

    this.reportesService.descargarExcel({
      reportes,
      desglose: this.reportesService.calcularDesglose(reportes),
      totales: this.reportesService.calcularTotales(reportes),
      saldosMinisterio,
      kardex,
      nombreMinisterioKardex,
      etiquetaFiltro: construirEtiquetaFiltroReporte({
        filtroMes: this.filtroMes,
        etiquetaMesActivo: this.etiquetaMesActivo,
        filtroMinisterioId: this.filtroMinisterioId,
        ministerioScopeId: this.ministerioScopeId,
        nombreMinisterio: this.listaMinisterios.find(m => mismoIdNumerico(m.id, this.filtroMinisterioId))?.nombre,
        searchTerm: this.searchTerm,
        filtroMovimiento: this.filtroMovimiento
      }),
      nombreArchivo: `reportes_ieca${sufijo}_${fecha}.xlsx`
    });

    void this.mostrarToast(
      `Excel descargado (${reportes.length} registro${reportes.length === 1 ? '' : 's'}).`,
      'success'
    );
  }

  async mostrarToast(mensaje: string, color: string): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color);
  }
}
