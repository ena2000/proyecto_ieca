import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton,
  IonTitle, IonContent, IonIcon, IonButton
} from '@ionic/angular/standalone';

interface Movimiento {
  tipo: 'ingreso' | 'gasto';
  titulo: string;
  ministerio: string;
  monto: number;
  fecha: string;
}

interface Ministerio {
  nombre: string;
  color: string;
  porcentaje: number;
}

interface MesData {
  mes: string;
  ingresos: number;
  gastos: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonButtons, IonMenuButton,
    IonTitle, IonContent, IonIcon, IonButton
  ]
})
export class DashboardComponent {

  mesActual = 'Mayo 2026';

  kpis = {
    balance: 3840.50,
    ingresos: 1250.00,
    gastosMes: 420.15,
    ministeriosActivos: 4,
    tendenciaIngresos: '+12%',
    tendenciaGastos: '-5%',
    superavit: 829.85,
    transacciones: 18
  };

  chartData: MesData[] = [
    { mes: 'Dic', ingresos: 980,  gastos: 310 },
    { mes: 'Ene', ingresos: 1100, gastos: 450 },
    { mes: 'Feb', ingresos: 870,  gastos: 280 },
    { mes: 'Mar', ingresos: 1320, gastos: 390 },
    { mes: 'Abr', ingresos: 1050, gastos: 360 },
    { mes: 'May', ingresos: 1250, gastos: 420 },
  ];

  ministerios: Ministerio[] = [
    { nombre: 'General',    color: '#1e3a8a', porcentaje: 42 },
    { nombre: 'Juvenil',    color: '#7c3aed', porcentaje: 28 },
    { nombre: 'Pro-Templo', color: '#0891b2', porcentaje: 18 },
    { nombre: 'Diaconado',  color: '#059669', porcentaje: 12 },
  ];

  movimientos: Movimiento[] = [
    { tipo: 'ingreso', titulo: 'Diezmos Dominicales',   ministerio: 'General',    monto: 520.00, fecha: 'Hoy'    },
    { tipo: 'gasto',   titulo: 'Mantenimiento Equipos', ministerio: 'General',    monto: 45.00,  fecha: 'Ayer'   },
    { tipo: 'ingreso', titulo: 'Ofrendas Pro-Templo',   ministerio: 'Pro-Templo', monto: 150.00, fecha: '17 May' },
    { tipo: 'ingreso', titulo: 'Ofrenda Juvenil',       ministerio: 'Juvenil',    monto: 80.00,  fecha: '16 May' },
    { tipo: 'gasto',   titulo: 'Servicios Básicos',     ministerio: 'General',    monto: 95.15,  fecha: '15 May' },
  ];

  get chartMax(): number {
    return Math.max(...this.chartData.map(d => Math.max(d.ingresos, d.gastos))) * 1.15;
  }

  barHeight(value: number): string {
    return Math.round((value / this.chartMax) * 128) + 'px';
  }
}