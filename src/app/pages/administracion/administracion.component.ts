import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonButton, IonIcon, IonMenuToggle, IonRouterLink,
  ToastController
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  peopleOutline, businessOutline, trendingUpOutline, trendingDownOutline,
  settingsOutline, notificationsOutline, lockClosedOutline,
  alertCircleOutline, arrowForwardOutline, statsChartOutline,
  walletOutline, calendarOutline, checkmarkCircleOutline,
  shieldCheckmarkOutline, timeOutline, cloudDownloadOutline,
  cloudUploadOutline, trashOutline
} from 'ionicons/icons';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✅ Interfaces importadas desde DataService — ya no se definen localmente
import { DataService } from '../../services/data.service';

// ✅ Interfaces propias de este componente (no existen en DataService)
interface ResumenItem {
  label: string;
  valor: string;
  icono: string;
  color: string;
  sub:   string;
}

interface Actividad {
  accion: string;
  modulo: string;
  tiempo: string;
  icono:  string;
  color:  string;
}

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
    IonContent, IonButton, IonIcon, IonMenuToggle, IonRouterLink
  ],
  providers: [AlertController, ToastController]
})
export class AdministracionComponent implements OnInit, OnDestroy {

  resumen: ResumenItem[] = [
    { label: 'Balance actual',   valor: '$0',  icono: 'wallet-outline',          color: 'blue',   sub: 'Fondos disponibles'      },
    { label: 'Periodo activo',   valor: '',    icono: 'calendar-outline',         color: 'purple', sub: 'Contabilidad abierta'    },
    { label: 'Usuarios activos', valor: '0',   icono: 'checkmark-circle-outline', color: 'green',  sub: 'Usuarios registrados'    },
    { label: 'Último cierre',    valor: 'N/A', icono: 'time-outline',             color: 'orange', sub: 'Sin cierres registrados' },
  ];

  accesosRapidos = [
    { titulo: 'Usuarios',    descripcion: 'Cuentas y permisos de acceso',  icono: 'people-outline',        ruta: '/usuarios',    color: 'blue'   },
    { titulo: 'Ministerios', descripcion: 'Departamentos y liderazgos',    icono: 'business-outline',      ruta: '/ministerios', color: 'purple' },
    { titulo: 'Ingresos',    descripcion: 'Ofrendas, diezmos y entradas',  icono: 'trending-up-outline',   ruta: '/ingresos',    color: 'green'  },
    { titulo: 'Gastos',      descripcion: 'Egresos y compras autorizadas', icono: 'trending-down-outline', ruta: '/gastos',      color: 'red'    },
    { titulo: 'Reportes',    descripcion: 'Balances y estados financieros',icono: 'stats-chart-outline',   ruta: '/reportes',    color: 'orange' },
  ];

  configIglesia = {
    nombre:        'Iglesia Evangélica La Alborada',
    moneda:        'USD – Dólar americano',
    periodoActual: '',
    responsable:   'Administrador Principal',
    version:       'v2.1.0'
  };

  actividad: Actividad[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private dataService:     DataService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      'people-outline':            peopleOutline,
      'business-outline':          businessOutline,
      'trending-up-outline':       trendingUpOutline,
      'trending-down-outline':     trendingDownOutline,
      'settings-outline':          settingsOutline,
      'notifications-outline':     notificationsOutline,
      'lock-closed-outline':       lockClosedOutline,
      'alert-circle-outline':      alertCircleOutline,
      'arrow-forward-outline':     arrowForwardOutline,
      'stats-chart-outline':       statsChartOutline,
      'wallet-outline':            walletOutline,
      'calendar-outline':          calendarOutline,
      'checkmark-circle-outline':  checkmarkCircleOutline,
      'shield-checkmark-outline':  shieldCheckmarkOutline,
      'time-outline':              timeOutline,
      'cloud-download-outline':    cloudDownloadOutline,
      'cloud-upload-outline':      cloudUploadOutline,
      'trash-outline':             trashOutline
    });
  }

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
    const kpis        = this.dataService.calcularKPIs();
    const usuarios    = this.dataService.getUsuariosActuales();
    const mesActual   = this.getMesActual();
    const ultimoCierre = localStorage.getItem('ultimoCierre') || 'N/A';

    this.resumen = [
      {
        label: 'Balance actual',
        valor: '$ ' + kpis.balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        icono: 'wallet-outline',
        color: 'blue',
        sub:   'Fondos disponibles'
      },
      {
        label: 'Periodo activo',
        valor: mesActual,
        icono: 'calendar-outline',
        color: 'purple',
        sub:   'Contabilidad abierta'
      },
      {
        label: 'Usuarios activos',
        valor: usuarios.length.toString(),
        icono: 'checkmark-circle-outline',
        color: 'green',
        sub:   'Usuarios registrados'
      },
      {
        label: 'Último cierre',
        valor: ultimoCierre,
        icono: 'time-outline',
        color: 'orange',
        sub:   ultimoCierre === 'N/A' ? 'Sin cierres registrados' : 'Periodo cerrado'
      },
    ];

    this.actividad                   = this.generarActividadReciente();
    this.configIglesia.periodoActual = this.getPeriodoActual();
  }

  private generarActividadReciente(): Actividad[] {
    const ingresos    = this.dataService.getIngresosActuales();
    const gastos      = this.dataService.getGastosActuales();
    const usuarios    = this.dataService.getUsuariosActuales();
    const ministerios = this.dataService.getMinisteriosActuales();
    const actividades: Actividad[] = [];

    ingresos.slice(0, 2).forEach(i => {
      actividades.push({
        accion: `Nuevo ingreso: ${i.descripcion}`,
        modulo: 'Ingresos',
        tiempo: this.calcularTiempoRelativo(i.fecha),
        icono:  'trending-up-outline',
        color:  'green'
      });
    });

    gastos.slice(0, 2).forEach(g => {
      actividades.push({
        accion: `Gasto registrado: ${g.descripcion}`,
        modulo: 'Gastos',
        tiempo: this.calcularTiempoRelativo(g.fecha),
        icono:  'trending-down-outline',
        color:  'red'
      });
    });

    if (ministerios.length > 0 && actividades.length < 3) {
      actividades.push({
        accion: `Ministerios activos: ${ministerios.filter(m => m.estado === 'Activo').length}`,
        modulo: 'Ministerios',
        tiempo: 'Hoy',
        icono:  'business-outline',
        color:  'purple'
      });
    }

    if (usuarios.length > 0 && actividades.length < 4) {
      actividades.push({
        accion: `Total de usuarios: ${usuarios.length}`,
        modulo: 'Usuarios',
        tiempo: 'Hoy',
        icono:  'people-outline',
        color:  'blue'
      });
    }

    if (actividades.length === 0) {
      actividades.push({
        accion: 'Sin actividad reciente',
        modulo: 'Sistema',
        tiempo: 'N/A',
        icono:  'stats-chart-outline',
        color:  'orange'
      });
    }

    return actividades.slice(0, 4);
  }

  private calcularTiempoRelativo(fecha: string): string {
    const ahora      = new Date();
    const fechaObj   = new Date(fecha);
    const diferencia = ahora.getTime() - fechaObj.getTime();
    const minutos    = Math.floor(diferencia / 60000);
    const horas      = Math.floor(diferencia / 3600000);
    const dias       = Math.floor(diferencia / 86400000);

    if (minutos < 60)  return `Hace ${minutos} min`;
    if (horas   < 24)  return `Hace ${horas} h`;
    if (dias    === 1) return 'Ayer';
    if (dias    < 7)   return `Hace ${dias} días`;
    return 'Hace más de una semana';
  }

  private getMesActual(): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const ahora = new Date();
    return `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
  }

  private getPeriodoActual(): string {
    const ahora = new Date();
    const mes   = String(ahora.getMonth() + 1).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}`;
  }

  async ejecutarCierreMes() {
    const alert = await this.alertController.create({
      header:    '⚠️ Cierre Contable',
      subHeader: `Periodo: ${this.configIglesia.periodoActual}`,
      message:   'Esta acción congela todos los movimientos del periodo actual. <strong>Es irreversible.</strong> ¿Confirmas el cierre?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Sí, cerrar periodo',
          role:    'destructive',
          handler: () => {
            const fechaCierre = this.getMesActual();
            localStorage.setItem('ultimoCierre', fechaCierre);

            const ingresos = this.dataService.getIngresosActuales().map(i => ({ ...i, cerrado: true }));
            const gastos   = this.dataService.getGastosActuales().map(g => ({ ...g, cerrado: true }));
            localStorage.setItem('ingresos', JSON.stringify(ingresos));
            localStorage.setItem('gastos',   JSON.stringify(gastos));
            this.dataService.refreshAllData();

            this.mostrarToast(`Periodo ${this.configIglesia.periodoActual} cerrado exitosamente`, 'success');
            this.cargarDatos();
          }
        }
      ]
    });
    await alert.present();
  }

  exportarBackup() {
    const backup = {
      fecha:        new Date().toISOString(),
      version:      this.configIglesia.version,
      ingresos:     this.dataService.getIngresosActuales(),
      gastos:       this.dataService.getGastosActuales(),
      ministerios:  this.dataService.getMinisteriosActuales(),
      usuarios:     this.dataService.getUsuariosActuales(),
      ultimoCierre: localStorage.getItem('ultimoCierre') || null
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `backup_ieca_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.mostrarToast('Backup exportado exitosamente', 'success');
  }

  async importarBackup(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const alert = await this.alertController.create({
      header:  '⚠️ Restaurar Backup',
      message: 'Esto reemplazará <strong>todos los datos actuales</strong> con los del archivo. ¿Confirmas?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Sí, restaurar',
          role:    'destructive',
          handler: () => {
            const reader    = new FileReader();
            reader.onload   = (e: any) => {
              try {
                const backup = JSON.parse(e.target.result);
                if (backup.ingresos)     localStorage.setItem('ingresos',     JSON.stringify(backup.ingresos));
                if (backup.gastos)       localStorage.setItem('gastos',       JSON.stringify(backup.gastos));
                if (backup.ministerios)  localStorage.setItem('ministerios',  JSON.stringify(backup.ministerios));
                if (backup.usuarios)     localStorage.setItem('usuarios',     JSON.stringify(backup.usuarios));
                if (backup.ultimoCierre) localStorage.setItem('ultimoCierre', backup.ultimoCierre);
                this.dataService.refreshAllData();
                this.cargarDatos();
                this.mostrarToast('Backup restaurado exitosamente', 'success');
              } catch (err) {
                this.mostrarToast('Error: archivo de backup inválido', 'danger');
              }
            };
            reader.readAsText(file);
          }
        }
      ]
    });
    await alert.present();
  }

  async limpiarTodosLosDatos() {
    const alert1 = await this.alertController.create({
      header:  '🚨 Eliminar todos los datos',
      message: 'Se borrarán <strong>todos los ingresos, gastos, ministerios y usuarios</strong>. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Sí, entiendo el riesgo',
          role:    'destructive',
          handler: async () => {
            const alert2 = await this.alertController.create({
              header:  '¿Estás completamente seguro?',
              message: 'Escribe ELIMINAR para confirmar.',
              inputs:  [{ name: 'confirmacion', type: 'text', placeholder: 'ELIMINAR' }],
              buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                  text:    'Eliminar todo',
                  role:    'destructive',
                  handler: (data) => {
                    if (data.confirmacion === 'ELIMINAR') {
                      localStorage.removeItem('ingresos');
                      localStorage.removeItem('gastos');
                      localStorage.removeItem('ministerios');
                      localStorage.removeItem('usuarios');
                      localStorage.removeItem('ultimoCierre');
                      this.dataService.refreshAllData();
                      this.cargarDatos();
                      this.mostrarToast('Todos los datos han sido eliminados', 'warning');
                    } else {
                      this.mostrarToast('Texto incorrecto, operación cancelada', 'medium');
                    }
                  }
                }
              ]
            });
            await alert2.present();
          }
        }
      ]
    });
    await alert1.present();
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message:  mensaje,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}