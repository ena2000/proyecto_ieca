import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ViewWillEnter, ViewWillLeave, ViewDidEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons,
  IonTitle, IonContent, IonIcon, IonButton,
  IonMenuToggle, IonRouterLink
} from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DataService, KPIs, MesData, Movimiento } from '../../services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesBellComponent } from '../../components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from '../../components/toolbar-menu-button/toolbar-menu-button.component';
import {
  porcentajeTendenciaDisplay,
  verboTendenciaDisplay
} from '../../shared/utils/tendencia-display.util';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonButtons,
    IonTitle, IonContent, IonIcon, IonButton,
    IonMenuToggle, IonRouterLink,
    NotificacionesBellComponent,
    ToolbarMenuButtonComponent
  ]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit, ViewWillEnter, ViewWillLeave, ViewDidEnter {

  @ViewChild('ingresosGastosChart') barChartCanvas?: ElementRef<HTMLCanvasElement>;

  private barChart?: import('chart.js').Chart;
  private chartJsLoaded = false;

  kpis: KPIs = {
    balance:            0,
    ingresos:           0,
    gastosMes:          0,
    ministeriosActivos: 0,
    tendenciaIngresos:  '0%',
    tendenciaGastos:    '0%',
    superavit:          0,
    transacciones:      0
  };

  chartData:    MesData[]   = [];
  movimientos:  Movimiento[] = [];
  ministerios: Array<{ nombre: string; color: string; monto: number; porcentaje: number }> = [];
  pendientes = { ingresos: 0, gastos: 0, total: 0 };

  ministerioScopeId: number | null = null;
  nombreMinisterioScope = '';
  puedeAprobar = false;
  tituloAlcance = 'Iglesia del Evangelio Cuadrangular "La Alborada"';

  private destroy$ = new Subject<void>();
  private chartUpdateTimer: ReturnType<typeof setTimeout> | undefined;
  private chartsReady = false;
  private chartUpdating = false;
  private lastChartFingerprint = '';
  private lastRemoteRefresh = 0;
  private readonly remoteRefreshMs = 120_000;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.ministerioScopeId = this.authService.getMinisterioScopeId();
    this.puedeAprobar = this.authService.isAdministrador();
    this.actualizarAlcanceMinisterio();
  }

  ngOnInit() {
    this.dataService.dataRevision$
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => this.cargarDatos(false));

    void this.inicializarDatos();
  }

  private async inicializarDatos(): Promise<void> {
    if (!this.dataService.hasRemoteData()) {
      await this.dataService.bootstrapRemote();
    }
    this.cargarDatos(true);
  }

  ngOnDestroy() {
    if (this.chartUpdateTimer != null) {
      clearTimeout(this.chartUpdateTimer);
    }
    this.destroyBarChart();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.chartsReady = true;
    this.scheduleBarChartUpdate(true);
  }

  ionViewWillEnter() {
    if (!this.dataService.hasRemoteData()) {
      void this.dataService.bootstrapRemote().then(() => this.cargarDatos(false));
      return;
    }

    const now = Date.now();
    if (now - this.lastRemoteRefresh >= this.remoteRefreshMs) {
      this.lastRemoteRefresh = now;
      void this.dataService.refreshFinanzas();
    }
    this.cargarDatos(false);
  }

  ionViewDidEnter() {
    // Tras volver de otra ruta el canvas ya está en el DOM; recrear si se destruyó al salir.
    if (this.chartsReady && this.chartTieneDatos && !this.barChart) {
      this.scheduleBarChartUpdate(true);
    }
  }

  ionViewWillLeave() {
    if (this.chartUpdateTimer != null) {
      clearTimeout(this.chartUpdateTimer);
      this.chartUpdateTimer = undefined;
    }
    this.destroyBarChart();
  }

  private cargarDatos(forceChartUpdate = false) {
    const scope = this.ministerioScopeId ?? undefined;
    this.kpis        = this.dataService.calcularKPIs(scope);
    this.chartData   = this.dataService.getChartData(scope);
    this.movimientos = this.dataService.getUltimosMovimientos(5, scope);

    this.actualizarAlcanceMinisterio();

    this.ministerios = this.dataService.getDistribucionMinisterios(scope).map(d => ({
      nombre:     d.nombre,
      color:      d.color,
      monto:      d.monto,
      porcentaje: d.porcentaje
    }));

    this.pendientes = this.dataService.getConteoPendientes(scope);

    const fingerprint = JSON.stringify(this.chartData);
    const graficoAusente = this.chartTieneDatos && this.barChart == null;
    if (forceChartUpdate || fingerprint !== this.lastChartFingerprint || graficoAusente) {
      this.lastChartFingerprint = fingerprint;
      this.scheduleBarChartUpdate(forceChartUpdate || graficoAusente);
    }
  }

  private scheduleBarChartUpdate(immediate = false): void {
    if (!this.chartsReady) return;

    if (this.chartUpdateTimer != null) {
      clearTimeout(this.chartUpdateTimer);
    }

    const remount = this.barChart == null && this.chartTieneDatos;
    const delay = immediate ? (remount ? 60 : 0) : 120;
    this.chartUpdateTimer = setTimeout(() => {
      this.chartUpdateTimer = undefined;
      this.ngZone.runOutsideAngular(() => this.updateBarChart());
    }, delay);
  }

  get chartTotales(): { ingresos: number; gastos: number } {
    return this.chartData.reduce(
      (acc, d) => ({ ingresos: acc.ingresos + d.ingresos, gastos: acc.gastos + d.gastos }),
      { ingresos: 0, gastos: 0 }
    );
  }

  get chartTieneDatos(): boolean {
    return this.chartData.some(d => d.ingresos > 0 || d.gastos > 0);
  }

  get esVistaMinisterio(): boolean {
    return this.ministerioScopeId != null;
  }

  get tituloTarjetaLateral(): string {
    return 'Resumen del mes';
  }

  get subtituloTarjetaLateral(): string {
    return this.esVistaMinisterio
      ? (this.nombreMinisterioScope || 'Tu ministerio')
      : 'Balance e ingresos por ministerio';
  }

  get proporcionIngresosMes(): number {
    const total = this.kpis.ingresos + this.kpis.gastosMes;
    return total > 0 ? (this.kpis.ingresos / total) * 100 : 0;
  }

  get proporcionGastosMes(): number {
    const total = this.kpis.ingresos + this.kpis.gastosMes;
    return total > 0 ? (this.kpis.gastosMes / total) * 100 : 0;
  }

  get tendenciaIngresosPorcentaje(): string {
    return porcentajeTendenciaDisplay(this.kpis.tendenciaIngresos);
  }

  get tendenciaGastosPorcentaje(): string {
    return porcentajeTendenciaDisplay(this.kpis.tendenciaGastos);
  }

  get tendenciaIngresosVerbo(): string {
    const v = verboTendenciaDisplay(this.kpis.tendenciaIngresos);
    return v === 'Igual' ? 'Igual que mes ant.' : v;
  }

  get tendenciaGastosVerbo(): string {
    const v = verboTendenciaDisplay(this.kpis.tendenciaGastos);
    return v === 'Igual' ? 'Igual que mes ant.' : v;
  }

  get tendenciaIngresosPositiva(): boolean {
    return !this.kpis.tendenciaIngresos.startsWith('-');
  }

  get tendenciaGastosPositiva(): boolean {
    return !this.kpis.tendenciaGastos.startsWith('-');
  }

  get ultimoRegistroEtiqueta(): string {
    return this.movimientos[0]?.fecha ?? 'Sin registros';
  }

  private actualizarAlcanceMinisterio(): void {
    if (this.ministerioScopeId == null) {
      this.nombreMinisterioScope = '';
      return;
    }

    const min = this.dataService.getMinisteriosActuales().find(
      m => Number(m.id) === this.ministerioScopeId
    );
    this.nombreMinisterioScope = min?.nombre ?? 'Tu ministerio';
    this.tituloAlcance = `Ministerio: ${this.nombreMinisterioScope}`;
  }

  private destroyBarChart(): void {
    this.barChart?.destroy();
    this.barChart = undefined;
  }

  private formatCurrency(value: number): string {
    return '$ ' + value.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private async updateBarChart(): Promise<void> {
    if (this.chartUpdating) return;

    const canvas = this.barChartCanvas?.nativeElement;
    if (!canvas || !this.chartTieneDatos) {
      this.destroyBarChart();
      return;
    }

    this.chartUpdating = true;
    try {
      const { Chart, registerables } = await import('chart.js');
      if (!this.chartJsLoaded) {
        Chart.register(...registerables);
        this.chartJsLoaded = true;
      }

      this.syncChartCanvasSize(canvas);

      const labels = this.chartData.map(d => d.mes);
      const ingresos = this.chartData.map(d => d.ingresos);
      const gastos = this.chartData.map(d => d.gastos);

      if (this.barChart) {
        this.barChart.data.labels = labels;
        this.barChart.data.datasets[0].data = ingresos;
        this.barChart.data.datasets[1].data = gastos;
        this.barChart.update('none');
        return;
      }

      this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresos,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            hoverBackgroundColor: '#059669',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Gastos',
            data: gastos,
            backgroundColor: 'rgba(239, 68, 68, 0.82)',
            hoverBackgroundColor: '#dc2626',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: this.barChartOptions()
      });
    } finally {
      this.chartUpdating = false;
    }
  }

  /** Tamaño fijo del canvas: evita el bucle ResizeObserver ↔ change detection de Chart.js. */
  private syncChartCanvasSize(canvas: HTMLCanvasElement): void {
    const wrap = canvas.parentElement;
    if (!wrap) return;
    const w = Math.max(1, wrap.clientWidth);
    const h = Math.max(1, wrap.clientHeight);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  private barChartOptions(): import('chart.js').ChartConfiguration<'bar'>['options'] {
    return {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { family: 'Inter, sans-serif', size: 12, weight: 'bold' },
          bodyFont: { family: 'Inter, sans-serif', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${this.formatCurrency(Number(ctx.parsed.y ?? 0))}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          ticks: {
            color: '#94a3b8',
            font: { family: 'Inter, sans-serif', size: 11 },
            callback: (value) => this.formatAxis(Number(value))
          }
        }
      }
    };
  }

  formatAxis(value: number): string {
    if (value >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1_000) return '$' + (value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return '$' + Math.round(value);
  }
}
