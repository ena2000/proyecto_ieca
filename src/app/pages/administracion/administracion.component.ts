import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline, businessOutline, trendingUpOutline, trendingDownOutline,
  settingsOutline, notificationsOutline, lockClosedOutline,
  alertCircleOutline, arrowForwardOutline, statsChartOutline,
  walletOutline, calendarOutline, checkmarkCircleOutline,
  shieldCheckmarkOutline, timeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
    IonContent, IonButton, IonIcon
  ]
})
export class AdministracionComponent {

  constructor(private router: Router) {
    addIcons({
      'people-outline': peopleOutline,
      'business-outline': businessOutline,
      'trending-up-outline': trendingUpOutline,
      'trending-down-outline': trendingDownOutline,
      'settings-outline': settingsOutline,
      'notifications-outline': notificationsOutline,
      'lock-closed-outline': lockClosedOutline,
      'alert-circle-outline': alertCircleOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'stats-chart-outline': statsChartOutline,
      'wallet-outline': walletOutline,
      'calendar-outline': calendarOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'time-outline': timeOutline
    });
  }

  resumen = [
    { label: 'Balance actual',      valor: '$ 3,840.50', icono: 'wallet-outline',          color: 'blue',   sub: 'Fondos disponibles'   },
    { label: 'Periodo activo',       valor: 'Mayo 2026',  icono: 'calendar-outline',         color: 'purple', sub: 'Contabilidad abierta' },
    { label: 'Módulos habilitados',  valor: '5',          icono: 'checkmark-circle-outline', color: 'green',  sub: 'Todos operativos'     },
    { label: 'Último cierre',        valor: 'Abr 2026',   icono: 'time-outline',             color: 'orange', sub: 'Hace 30 días'         },
  ];

  accesosRapidos = [
    { titulo: 'Usuarios',    descripcion: 'Cuentas y permisos de acceso',  icono: 'people-outline',        ruta: '/usuarios',    color: 'blue'   },
    { titulo: 'Ministerios', descripcion: 'Departamentos y liderazgos',     icono: 'business-outline',      ruta: '/ministerios', color: 'purple' },
    { titulo: 'Ingresos',    descripcion: 'Ofrendas, diezmos y entradas',   icono: 'trending-up-outline',   ruta: '/ingresos',    color: 'green'  },
    { titulo: 'Gastos',      descripcion: 'Egresos y compras autorizadas',  icono: 'trending-down-outline', ruta: '/gastos',      color: 'red'    },
    { titulo: 'Reportes',    descripcion: 'Balances y estados financieros', icono: 'stats-chart-outline',   ruta: '/reportes',    color: 'orange' },
  ];

  configIglesia = {
    nombre:        'Iglesia Evangélica La Alborada',
    moneda:        'USD – Dólar americano',
    periodoActual: new Date().toISOString().substring(0, 7),
    responsable:   'Administrador Principal',
    version:       'v2.1.0'
  };

  actividad = [
    { accion: 'Nuevo ingreso registrado', modulo: 'Ingresos', tiempo: 'Hace 5 min', icono: 'trending-up-outline',   color: 'green'  },
    { accion: 'Usuario creado: jlopez',   modulo: 'Usuarios', tiempo: 'Hace 1 h',   icono: 'people-outline',        color: 'blue'   },
    { accion: 'Gasto aprobado #0042',     modulo: 'Gastos',   tiempo: 'Hace 3 h',   icono: 'trending-down-outline', color: 'red'    },
    { accion: 'Reporte mensual generado', modulo: 'Reportes', tiempo: 'Ayer',        icono: 'stats-chart-outline',   color: 'orange' },
  ];

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }

  async ejecutarCierreMes() {
    const confirmar = confirm(
      `¿Confirmar cierre contable para el periodo ${this.configIglesia.periodoActual}?\nEsta acción es irreversible.`
    );
    if (confirmar) {
      alert(`Periodo ${this.configIglesia.periodoActual} cerrado exitosamente.`);
    }
  }
}