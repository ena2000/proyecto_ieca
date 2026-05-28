import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton,
  IonTitle, IonContent, IonIcon, IonButton,
  IonMenuToggle, IonRouterLink
} from '@ionic/angular/standalone';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✅ Interfaces importadas desde DataService — ya no se definen localmente
import { DataService, KPIs, MesData, Movimiento } from '../../services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesBellComponent } from '../../components/notificaciones-bell/notificaciones-bell.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonButtons, IonMenuButton,
    IonTitle, IonContent, IonIcon, IonButton,
    IonMenuToggle, IonRouterLink,
    NotificacionesBellComponent
  ]
})
export class DashboardComponent implements OnInit, OnDestroy, ViewWillEnter {

  // ✅ Tipado con interfaces del DataService
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

  ministerios: Array<{ nombre: string; color: string; porcentaje: number }> = [];

  ministerioScopeId: number | null = null;
  tituloAlcance = 'Iglesia Evangélica La Alborada';

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.ministerioScopeId = this.authService.getMinisterioScopeId();
    if (this.ministerioScopeId != null) {
      const min = this.dataService.getMinisteriosActuales().find(m => m.id === this.ministerioScopeId);
      if (min?.nombre) {
        this.tituloAlcance = `Ministerio: ${min.nombre}`;
      }
    }
  }

  ngOnInit() {
    this.cargarDatos();

    combineLatest([
      this.dataService.ingresos$,
      this.dataService.gastos$,
      this.dataService.ministerios$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarDatos());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    this.dataService.refreshAllData();
    this.cargarDatos();
  }

  private cargarDatos() {
    const scope = this.ministerioScopeId ?? undefined;
    this.kpis        = this.dataService.calcularKPIs(scope);
    this.chartData   = this.dataService.getChartData(scope);
    this.movimientos = this.dataService.getUltimosMovimientos(5, scope);

    if (this.ministerioScopeId != null) {
      const min = this.dataService.getMinisteriosActuales().find(m => m.id === this.ministerioScopeId);
      if (min?.nombre) {
        this.tituloAlcance = `Ministerio: ${min.nombre}`;
      }
    }

    this.ministerios = this.dataService.getDistribucionMinisterios(scope).map(d => ({
      nombre:     d.nombre,
      color:      d.color,
      porcentaje: d.porcentaje
    }));
  }

  get chartMax(): number {
    if (this.chartData.length === 0) return 100;
    const peak = Math.max(...this.chartData.map(d => Math.max(d.ingresos, d.gastos)));
    if (peak === 0) return 100;
    const step = this.niceStep(peak);
    return Math.ceil(peak / step) * step;
  }

  get yAxisTicks(): number[] {
    const max = this.chartMax;
    const step = this.niceStep(max);
    const ticks: number[] = [];
    for (let v = max; v >= 0; v -= step) {
      ticks.push(v);
    }
    if (ticks[ticks.length - 1] !== 0) ticks.push(0);
    return ticks;
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

  barHeightPercent(value: number): number {
    const max = this.chartMax;
    if (max === 0 || value === 0) return 0;
    return Math.max((value / max) * 100, 3);
  }

  formatAxis(value: number): string {
    if (value >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1_000) return '$' + (value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return '$' + Math.round(value);
  }

  formatTooltip(value: number): string {
    return '$ ' + value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private niceStep(max: number): number {
    if (max <= 0) return 25;
    const raw = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let nice: number;
    if (norm <= 1) nice = 1;
    else if (norm <= 2) nice = 2;
    else if (norm <= 5) nice = 5;
    else nice = 10;
    return nice * mag;
  }
}