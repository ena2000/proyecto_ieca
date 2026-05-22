import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton,
  IonTitle, IonContent, IonIcon, IonButton
} from '@ionic/angular/standalone';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✅ Interfaces importadas desde DataService — ya no se definen localmente
import { DataService, KPIs, MesData, Movimiento } from '../../services/data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton,
    IonTitle, IonContent, IonIcon, IonButton
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {

  mesActual = this.getMesActual();

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

  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.cargarDatos();

    interval(3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarDatos());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos() {
    this.kpis       = this.dataService.calcularKPIs();
    this.chartData  = this.dataService.getChartData();
    this.movimientos = this.dataService.getUltimosMovimientos(5);
    this.mesActual  = this.getMesActual();

    // Distribución de ministerios mapeada al tipo local del template
    this.ministerios = this.dataService.getDistribucionMinisterios().map(d => ({
      nombre:     d.nombre,
      color:      d.color,
      porcentaje: d.porcentaje
    }));
  }

  private getMesActual(): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const ahora = new Date();
    return `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
  }

  get chartMax(): number {
    if (this.chartData.length === 0) return 100;
    return Math.max(...this.chartData.map(d => Math.max(d.ingresos, d.gastos))) * 1.15;
  }

  barHeight(value: number): string {
    const max = this.chartMax;
    if (max === 0) return '4px';
    return Math.round((value / max) * 128) + 'px';
  }
}