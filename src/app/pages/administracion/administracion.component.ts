import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonButton, IonIcon, IonMenuToggle, IonRouterLink,
  IonInput, IonItem, IonLabel, IonSelect, IonSelectOption,
  ToastController, LoadingController
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  peopleOutline, businessOutline, trendingUpOutline, trendingDownOutline,
  settingsOutline, notificationsOutline, lockClosedOutline,
  optionsOutline,
  alertCircleOutline, arrowForwardOutline, statsChartOutline,
  walletOutline, calendarOutline, checkmarkCircleOutline,
  shieldCheckmarkOutline, timeOutline, cloudDownloadOutline,
  cloudUploadOutline, trashOutline
} from 'ionicons/icons';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ActividadAdmin, BackupIeca, ConfigIglesia, ResumenAdmin } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../services/data.service';
import { AdministracionService } from '../../services/administracion.service';
import { NotificacionesBellComponent } from '../../components/notificaciones-bell/notificaciones-bell.component';
import { formatearISOaDDMMYYYY } from '../../shared/utils/date.util';
import { abrirSelectorFechaNativo } from '../../shared/utils/date-picker.util';
import { withLoadingResult, getHttpErrorMessage } from '../../shared/utils/loading.util';

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
    IonContent, IonButton, IonIcon, IonMenuToggle, IonRouterLink,
    IonInput, IonItem, IonLabel, IonSelect, IonSelectOption,
    NotificacionesBellComponent
  ],
  providers: [AlertController, ToastController, LoadingController]
})
export class AdministracionComponent implements OnInit, OnDestroy, ViewWillEnter {

  resumen: ResumenAdmin[] = [];
  actividad: ActividadAdmin[] = [];
  configIglesia: ConfigIglesia = {
    nombre:        '',
    periodoActual: '',
    version:       ''
  };
  mesActualCerrado = false;

  accesosRapidos = [
    { titulo: 'Usuarios',    descripcion: 'Cuentas y permisos de acceso',  icono: 'people-outline',        ruta: '/usuarios',    color: 'blue'   },
    { titulo: 'Ministerios', descripcion: 'Departamentos y liderazgos',    icono: 'business-outline',      ruta: '/ministerios', color: 'purple' },
    { titulo: 'Ingresos',    descripcion: 'Ofrendas, diezmos y entradas',  icono: 'trending-up-outline',   ruta: '/ingresos',    color: 'green'  },
    { titulo: 'Gastos',      descripcion: 'Egresos y compras autorizadas', icono: 'trending-down-outline', ruta: '/gastos',      color: 'red'    },
    { titulo: 'Reportes',    descripcion: 'Balances y estados financieros',icono: 'stats-chart-outline',   ruta: '/reportes',    color: 'orange' },
  ];

  // Filtros de auditoría (para descarga CSV)
  auditTipo: 'todos' | 'ingresos' | 'gastos' = 'todos';
  /** YYYY-MM-DD para API */
  auditDesde = '';
  auditHasta = '';
  auditFechaManualDesde = '';
  auditFechaManualHasta = '';

  @ViewChild('dateInputAuditDesde') dateInputAuditDesde?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInputAuditHasta') dateInputAuditHasta?: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private administracionService: AdministracionService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
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
    void this.cargarDatos();

    combineLatest([
      this.dataService.ingresos$,
      this.dataService.gastos$,
      this.dataService.usuarios$,
      this.dataService.ministerios$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => void this.cargarDatos());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    this.dataService.refreshAllData();
    void this.cargarDatos();
  }

  get usuarioSesion(): string {
    const sesion = this.authService.getSession();
    return sesion?.usuario?.trim() || '—';
  }

  private async cargarDatos() {
    await this.administracionService.cargarConfigRemota();
    this.resumen           = this.administracionService.getResumen();
    this.actividad         = this.administracionService.getActividadReciente();
    this.configIglesia     = this.administracionService.getConfigIglesia();
    this.mesActualCerrado  = this.administracionService.isMesActualCerrado();
  }

  async ejecutarCierreMes() {
    const alert = await this.alertController.create({
      header:    '⚠️ Cierre Financiero',
      subHeader: `Periodo: ${this.configIglesia.periodoActual}`,
      message:   'Esta acción congela todos los movimientos del periodo actual. <strong>Es irreversible.</strong> ¿Confirmas el cierre?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Sí, cerrar periodo',
          role:    'destructive',
          handler: () => {
            void withLoadingResult(this.loadingController, 'Cerrando periodo...', () =>
              this.administracionService.ejecutarCierreMes()
            )
              .then(() => {
                void this.cargarDatos();
                this.mostrarToast(`Periodo ${this.configIglesia.periodoActual} cerrado exitosamente`, 'success');
              })
              .catch((err: unknown) => {
                this.mostrarToast(getHttpErrorMessage(err, 'No se pudo ejecutar el cierre'), 'danger');
              });
          }
        }
      ]
    });
    await alert.present();
  }

  async exportarBackup() {
    try {
      const backup = await withLoadingResult(
        this.loadingController,
        'Generando respaldo...',
        () => this.administracionService.crearBackup()
      );
      this.administracionService.descargarBackup(backup);
      this.mostrarToast('Respaldo exportado exitosamente', 'success');
    } catch (err) {
      this.mostrarToast(getHttpErrorMessage(err, 'No se pudo generar el respaldo'), 'danger');
    }
  }

  abrirSelectorFecha(tipo: 'desde' | 'hasta'): void {
    const input =
      tipo === 'desde'
        ? this.dateInputAuditDesde?.nativeElement
        : this.dateInputAuditHasta?.nativeElement;
    abrirSelectorFechaNativo(input);
  }

  validarFechaManualAudit(event: Event, tipo: 'desde' | 'hasta'): void {
    const raw = (event as CustomEvent).detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
    let val = String(raw).replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);

    if (tipo === 'desde') {
      this.auditFechaManualDesde = val;
    } else {
      this.auditFechaManualHasta = val;
    }

    if (val.length === 10) {
      const parts = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const ymd = `${yyyy}-${mm}-${dd}`;
        if (tipo === 'desde') {
          this.auditDesde = ymd;
        } else {
          this.auditHasta = ymd;
        }
      }
    }
  }

  onNativeDateChangeAudit(value: string, tipo: 'desde' | 'hasta'): void {
    const yyyyMMdd = String(value || '').trim();
    if (!yyyyMMdd) return;
    const iso = new Date(`${yyyyMMdd}T00:00:00`).toISOString();
    const formateada = formatearISOaDDMMYYYY(iso);
    if (tipo === 'desde') {
      this.auditDesde = yyyyMMdd;
      this.auditFechaManualDesde = formateada;
    } else {
      this.auditHasta = yyyyMMdd;
      this.auditFechaManualHasta = formateada;
    }
  }

  async descargarAuditoria() {
    try {
      await withLoadingResult(this.loadingController, 'Generando auditoría...', () =>
        this.administracionService.descargarAuditoriaCsv({
          tipo: this.auditTipo,
          desde: this.auditDesde || undefined,
          hasta: this.auditHasta || undefined
        })
      );
      this.mostrarToast('Auditoría descargada', 'success');
    } catch (err) {
      this.mostrarToast(getHttpErrorMessage(err, 'No se pudo descargar la auditoría'), 'danger');
    }
  }

  async importarBackup(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
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
            const reader = new FileReader();
            reader.onload = async (e: ProgressEvent<FileReader>) => {
              try {
                const backup = JSON.parse(e.target?.result as string) as BackupIeca;
                await withLoadingResult(this.loadingController, 'Restaurando respaldo...', () =>
                  this.administracionService.restaurarBackup(backup)
                );
                await this.cargarDatos();
                this.mostrarToast('Respaldo restaurado exitosamente', 'success');
              } catch (err) {
                this.mostrarToast(
                  getHttpErrorMessage(err, 'Error: archivo de respaldo inválido o fallo en el servidor'),
                  'danger'
                );
              }
            };
            reader.readAsText(file);
          }
        }
      ]
    });
    await alert.present();
    input.value = '';
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
                      void this.administracionService.limpiarTodosLosDatos().then(() => {
                        void this.cargarDatos();
                        this.mostrarToast('Todos los datos han sido eliminados', 'warning');
                      }).catch((err) => {
                        this.mostrarToast(getHttpErrorMessage(err, 'No se pudieron eliminar los datos'), 'danger');
                      });
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
