import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonButton, ToastController, IonLabel, IonItem,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { KardexLinea, Ministerio, Reporte } from '../../core/models';
import { DataService } from '../../services/data.service';
import { ReportesService } from '../../services/reportes.service';
import { AuthService } from '../../core/services/auth.service';
import { etiquetaParaMes } from '../../shared/utils/month.util';
import { formatearMoneda } from '../../shared/utils/currency.util';
import { registerReportesPageIcons } from '../../shared/utils/reportes-page.icons';
import {
  FiltroMovimientoReporte,
  PeriodoPresetReporte,
  filtrarReportes,
  hayFiltrosReporteActivos,
  resolverFiltroMesPorPreset,
  mesesDisponiblesDesdeReportes,
  puedeAvanzarMesReporte,
  mesAnteriorReporte,
  mesSiguienteReporte,
  etiquetaFiltroMovimientoReporte,
  construirEtiquetaFiltroReporte
} from '../../shared/utils/reportes-filtros.util';
import { presentIecaToast } from '../../shared/utils/toast.util';

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
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
    IonIcon, IonButton, IonLabel, IonItem, IonSelect, IonSelectOption,
    NotificacionesBellComponent
  ],
  providers: [ToastController]
})
export class ReportesComponent implements OnInit, OnDestroy {
  readonly formatearMoneda = formatearMoneda;

  listaReportes: Reporte[] = [];
  listaMinisterios: Pick<Ministerio, 'id' | 'nombre'>[] = [];
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.ministerioScopeId = this.authService.getMinisterioScopeId();
    if (this.ministerioScopeId != null) {
      this.filtroMinisterioId = this.ministerioScopeId;
      this.filtroMinisterioBloqueado = true;
    }
    this.actualizarDatos();
    this.setPeriodo('este_mes');
    combineLatest([this.dataService.ingresos$, this.dataService.gastos$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarDatos());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private actualizarDatos(): void {
    this.listaMinisterios = this.dataService.getMinisteriosActuales().map(m => ({
      id: m.id,
      nombre: m.nombre
    }));
    this.listaReportes = this.reportesService.generarReportes();
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
  }

  get etiquetaMesActivo(): string {
    return this.filtroMes ? etiquetaParaMes(this.filtroMes) : 'Todo el historial';
  }

  /** Etiqueta corta para títulos y totales del bloque “período”. */
  get etiquetaPeriodoResumen(): string {
    return this.etiquetaMesActivo;
  }

  get mesesDisponibles(): { value: string; label: string }[] {
    return mesesDisponiblesDesdeReportes(this.listaReportes);
  }

  get puedeAvanzarMes(): boolean {
    return puedeAvanzarMesReporte(this.filtroMes);
  }

  get hayFiltrosActivos(): boolean {
    return hayFiltrosReporteActivos(this.filtrosReporte);
  }

  get hayFiltrosActivosExportacion(): boolean {
    return this.hayFiltrosActivos;
  }

  setPeriodo(preset: PeriodoPresetReporte): void {
    this.periodoPreset = preset;
    this.filtroMes = resolverFiltroMesPorPreset(preset);
  }

  onMesCambio(): void {
    this.periodoPreset = 'custom';
  }

  mesAnterior(): void {
    this.filtroMes = mesAnteriorReporte(this.filtroMes);
    this.periodoPreset = 'custom';
  }

  mesSiguiente(): void {
    if (!this.puedeAvanzarMes) return;
    this.filtroMes = mesSiguienteReporte(this.filtroMes);
    this.periodoPreset = 'custom';
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroMovimiento = 'todos';
    if (!this.filtroMinisterioBloqueado) {
      this.filtroMinisterioId = null;
    }
    this.setPeriodo('este_mes');
  }

  get listaFiltrada(): Reporte[] {
    return filtrarReportes(this.listaReportes, this.filtrosReporte);
  }

  get etiquetaFiltroMovimiento(): string {
    return etiquetaFiltroMovimientoReporte(this.filtroMovimiento);
  }

  get totalIngresosFiltrado(): number {
    return this.listaFiltrada.reduce((sum, r) => sum + (r.ingresos || 0), 0);
  }

  get totalGastosFiltrado(): number {
    return this.listaFiltrada.reduce((sum, r) => sum + (r.gastos || 0), 0);
  }

  get totalSaldoFiltrado(): number {
    return this.totalIngresosFiltrado - this.totalGastosFiltrado;
  }

  get desgloseAgregado() {
    return this.reportesService.calcularDesglose(this.listaFiltrada);
  }

  get desgloseMinisterioVista() {
    return this.reportesService.calcularDesglosePorMinisterio(
      this.listaFiltrada,
      this.listaMinisterios,
      this.ministerioScopeId
    );
  }

  get mostrarDesgloseMinisterio(): boolean {
    return this.desgloseMinisterioVista.length > 0;
  }

  get mostrarKardexMinisterio(): boolean {
    return this.filtroMinisterioId != null;
  }

  get nombreMinisterioKardex(): string {
    if (this.filtroMinisterioId == null) return '';
    return this.listaMinisterios.find(m => m.id === this.filtroMinisterioId)?.nombre ?? 'Ministerio';
  }

  get lineasKardex(): KardexLinea[] {
    if (this.filtroMinisterioId == null) return [];
    return this.dataService.getKardexMinisterio(this.filtroMinisterioId);
  }

  get lineasKardexVista(): KardexLinea[] {
    return [...this.lineasKardex].reverse();
  }

  get saldoDisponibleMinisterio(): number {
    if (this.filtroMinisterioId == null) return 0;
    return this.dataService.calcularSaldoMinisterio(this.filtroMinisterioId);
  }

  seleccionarMinisterioParaKardex(ministerioId: number): void {
    if (this.filtroMinisterioBloqueado) return;
    this.filtroMinisterioId = ministerioId;
  }

  limpiarSeleccionMinisterio(): void {
    if (this.filtroMinisterioBloqueado) return;
    this.filtroMinisterioId = null;
  }

  exportarExcel(): void {
    const reportes = this.listaFiltrada;
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
        m => m.id === this.filtroMinisterioId
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
        nombreMinisterio: this.listaMinisterios.find(m => m.id === this.filtroMinisterioId)?.nombre,
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
