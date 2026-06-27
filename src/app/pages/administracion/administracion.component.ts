import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonTitle,
  IonContent, IonButton, IonIcon, IonMenuToggle, IonRouterLink,
  IonInput, IonItem, IonLabel, IonSelect, IonSelectOption,
  ToastController, LoadingController
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ActividadAdmin, BackupIeca, ConfigIglesia, ResumenAdmin } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../services/data.service';
import { AdministracionService } from '../../services/administracion.service';
import { NotificacionesBellComponent } from '../../components/notificaciones-bell/notificaciones-bell.component';
import { ToolbarMenuButtonComponent } from '../../components/toolbar-menu-button/toolbar-menu-button.component';
import { abrirSelectorFechaNativo, resetNativosDateInputs } from '../../shared/utils/date-picker.util';
import { withLoadingResult, getHttpErrorMessage } from '../../shared/utils/loading.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import { registerAdministracionPageIcons } from '../../shared/utils/administracion-page.icons';
import {
  aplicarFechaManualAuditoria,
  aplicarFechaNativaAuditoria,
  actualizarEstadoFiltroFechaAuditoria
} from '../../shared/utils/audit-fecha.util';
import { ACCESOS_RAPIDOS_ADMIN } from './administracion-accesos.constants';
import { formatearMoneda } from '../../shared/utils/currency.util';
import { getMesActualLabel, periodoKeyFromFecha } from '../../shared/utils/month.util';

registerAdministracionPageIcons();

interface AportacionMinisterioVista {
  ministerioId: number;
  nombre: string;
  aportacionMes: number;
  aportacionHistorica: number;
}

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonButtons, IonTitle,
    IonContent, IonButton, IonIcon, IonMenuToggle, IonRouterLink,
    IonInput, IonItem, IonLabel, IonSelect, IonSelectOption,
    NotificacionesBellComponent, ToolbarMenuButtonComponent
  ],
  providers: [AlertController, ToastController, LoadingController]
})
export class AdministracionComponent implements OnInit, OnDestroy, ViewWillEnter {
  resumen: ResumenAdmin[] = [];
  actividad: ActividadAdmin[] = [];
  aportacionVista: AportacionMinisterioVista[] = [];
  totalAportacionMes = 0;
  totalAportacionHistorica = 0;
  readonly formatearMoneda = formatearMoneda;
  readonly etiquetaMesAportacion = getMesActualLabel();
  configIglesia: ConfigIglesia = { nombre: '', periodoActual: '', version: '' };
  mesActualCerrado = false;

  readonly accesosRapidos = ACCESOS_RAPIDOS_ADMIN;

  auditTipo: 'todos' | 'ingresos' | 'gastos' = 'todos';
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
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.dataService.ingresos$,
      this.dataService.gastos$,
      this.dataService.usuarios$,
      this.dataService.ministerios$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => void this.cargarDatos());
    void this.inicializarDatos();
  }

  private async inicializarDatos(): Promise<void> {
    await this.dataService.bootstrapRemote();
    await this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    void this.dataService.bootstrapRemote();
    void this.cargarDatos();
  }

  get usuarioSesion(): string {
    return this.authService.getSession()?.usuario?.trim() || '—';
  }

  private async cargarDatos(): Promise<void> {
    await this.administracionService.cargarConfigRemota();
    this.resumen = this.administracionService.getResumen();
    this.actividad = this.administracionService.getActividadReciente();
    this.configIglesia = this.administracionService.getConfigIglesia();
    this.mesActualCerrado = this.administracionService.isMesActualCerrado();
    const mesActual = periodoKeyFromFecha(new Date().toISOString());
    const delMes = this.dataService.getAportacionIglesiaPorMinisterio(mesActual);
    const historicas = this.dataService.getAportacionIglesiaPorMinisterio();
    const porIdMes = new Map(delMes.map(row => [row.ministerioId, row.aportacion]));
    const porIdHistorico = new Map(historicas.map(row => [row.ministerioId, row.aportacion]));

    this.aportacionVista = this.dataService.getMinisteriosActuales()
      .map(m => ({
        ministerioId: m.id,
        nombre: m.nombre,
        aportacionMes: porIdMes.get(m.id) ?? 0,
        aportacionHistorica: porIdHistorico.get(m.id) ?? 0
      }))
      .sort((a, b) => b.aportacionHistorica - a.aportacionHistorica);

    this.totalAportacionMes = this.dataService.getTotalAportacionIglesia(mesActual);
    this.totalAportacionHistorica = this.dataService.getTotalAportacionIglesia();
  }

  async ejecutarCierreMes(): Promise<void> {
    const alert = await this.alertController.create({
      header: '⚠️ Cierre Financiero',
      subHeader: `Periodo: ${this.configIglesia.periodoActual}`,
      message: `Esta acción congela todos los movimientos del periodo ${this.configIglesia.periodoActual}. Es irreversible. ¿Confirmas el cierre?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, cerrar periodo',
          role: 'destructive',
          handler: () => {
            void withLoadingResult(this.loadingController, 'Cerrando periodo...', () =>
              this.administracionService.ejecutarCierreMes()
            )
              .then(() => {
                void this.cargarDatos();
                void this.mostrarToast(`Periodo ${this.configIglesia.periodoActual} cerrado exitosamente`, 'success');
              })
              .catch((err: unknown) => {
                void this.mostrarToast(getHttpErrorMessage(err, 'No se pudo ejecutar el cierre'), 'danger');
              });
          }
        }
      ]
    });
    await alert.present();
  }

  async enviarResumenEmail(): Promise<void> {
    try {
      const result = await withLoadingResult(
        this.loadingController,
        'Enviando resumen...',
        () => this.administracionService.enviarResumenAlertasEmail(true)
      );

      if (result.skipped) {
        const msg = result.message || 'No se envió el correo.';
        await this.mostrarToast(msg, 'warning');
        return;
      }

      const canal = result.mailResult?.channel === 'email' ? 'correo' : 'consola (dev)';
      const n = result.resumen?.pendientes?.length ?? 0;
      await this.mostrarToast(
        `Resumen enviado por ${canal}. Pendientes antiguos: ${n}.`,
        'success'
      );
    } catch (err) {
      await this.mostrarToast(
        getHttpErrorMessage(err, 'No se pudo enviar el resumen'),
        'danger'
      );
    }
  }

  async exportarBackup(): Promise<void> {
    try {
      const backup = await withLoadingResult(
        this.loadingController,
        'Generando respaldo...',
        () => this.administracionService.crearBackup()
      );
      this.administracionService.descargarBackup(backup);
      await this.mostrarToast('Respaldo exportado exitosamente', 'success');
    } catch (err) {
      await this.mostrarToast(getHttpErrorMessage(err, 'No se pudo generar el respaldo'), 'danger');
    }
  }

  abrirSelectorFecha(tipo: 'desde' | 'hasta'): void {
    const input = tipo === 'desde'
      ? this.dateInputAuditDesde?.nativeElement
      : this.dateInputAuditHasta?.nativeElement;
    abrirSelectorFechaNativo(input);
  }

  validarFechaManualAudit(event: Event, tipo: 'desde' | 'hasta'): void {
    const raw = (event as CustomEvent).detail?.value
      ?? (event.target as HTMLInputElement)?.value
      ?? '';
    const upd = aplicarFechaManualAuditoria(String(raw), tipo);
    this.aplicarCambioFiltroFechaAudit(tipo, upd);
  }

  onNativeDateChangeAudit(value: string, tipo: 'desde' | 'hasta'): void {
    const upd = aplicarFechaNativaAuditoria(value, tipo);
    this.aplicarCambioFiltroFechaAudit(tipo, upd);
  }

  private aplicarCambioFiltroFechaAudit(
    tipo: 'desde' | 'hasta',
    upd: Partial<{
      auditDesde: string;
      auditHasta: string;
      auditFechaManualDesde: string;
      auditFechaManualHasta: string;
    }>
  ): void {
    const res = actualizarEstadoFiltroFechaAuditoria(tipo, upd, {
      auditDesde: this.auditDesde,
      auditHasta: this.auditHasta,
      auditFechaManualDesde: this.auditFechaManualDesde,
      auditFechaManualHasta: this.auditFechaManualHasta
    });
    if (!res.ok) {
      void this.mostrarToast(res.mensaje, 'warning');
    }
    this.auditDesde = res.estado.auditDesde;
    this.auditHasta = res.estado.auditHasta;
    this.auditFechaManualDesde = res.estado.auditFechaManualDesde;
    this.auditFechaManualHasta = res.estado.auditFechaManualHasta;
    if (res.resetNativo === 'desde') {
      resetNativosDateInputs([this.dateInputAuditDesde?.nativeElement]);
    } else if (res.resetNativo === 'hasta') {
      resetNativosDateInputs([this.dateInputAuditHasta?.nativeElement]);
    }
  }

  private filtrosAuditoria(): {
    tipo: 'todos' | 'ingresos' | 'gastos';
    desde?: string;
    hasta?: string;
  } {
    const tipo = this.auditTipo ?? 'todos';
    const desde =
      this.auditFechaManualDesde.trim().length === 10 && this.auditDesde
        ? this.auditDesde
        : undefined;
    const hasta =
      this.auditFechaManualHasta.trim().length === 10 && this.auditHasta
        ? this.auditHasta
        : undefined;
    return { tipo, desde, hasta };
  }

  limpiarFiltrosAuditoria(): void {
    this.auditTipo = 'todos';
    this.auditDesde = '';
    this.auditHasta = '';
    this.auditFechaManualDesde = '';
    this.auditFechaManualHasta = '';
    resetNativosDateInputs([
      this.dateInputAuditDesde?.nativeElement,
      this.dateInputAuditHasta?.nativeElement
    ]);
  }

  async descargarAuditoria(): Promise<void> {
    try {
      await withLoadingResult(this.loadingController, 'Generando auditoría...', () =>
        this.administracionService.descargarAuditoriaCsv(this.filtrosAuditoria())
      );
      await this.mostrarToast('Auditoría descargada', 'success');
    } catch (err) {
      await this.mostrarToast(getHttpErrorMessage(err, 'No se pudo descargar la auditoría'), 'danger');
    }
  }

  async importarBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const alert = await this.alertController.create({
      header: '⚠️ Restaurar Backup',
      message: 'Esto reemplazará todos los datos actuales con los del archivo de respaldo. ¿Confirmas?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, restaurar',
          role: 'destructive',
          handler: () => {
            const reader = new FileReader();
            reader.onload = async (e: ProgressEvent<FileReader>) => {
              try {
                const backup = JSON.parse(e.target?.result as string) as BackupIeca;
                await withLoadingResult(this.loadingController, 'Restaurando respaldo...', () =>
                  this.administracionService.restaurarBackup(backup)
                );
                await this.cargarDatos();
                await this.mostrarToast('Respaldo restaurado exitosamente', 'success');
              } catch (err) {
                await this.mostrarToast(
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

  async limpiarTodosLosDatos(): Promise<void> {
    const alert1 = await this.alertController.create({
      header: '🚨 Eliminar todos los datos',
      message: 'Se borrarán todos los ingresos, gastos, ministerios y usuarios. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, entiendo el riesgo',
          role: 'destructive',
          handler: async () => {
            const alert2 = await this.alertController.create({
              header: '¿Estás completamente seguro?',
              message: 'Escribe ELIMINAR para confirmar.',
              inputs: [{ name: 'confirmacion', type: 'text', placeholder: 'ELIMINAR' }],
              buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                  text: 'Eliminar todo',
                  role: 'destructive',
                  handler: (data) => {
                    if (data.confirmacion === 'ELIMINAR') {
                      void this.administracionService.limpiarTodosLosDatos()
                        .then(() => {
                          void this.cargarDatos();
                          void this.mostrarToast('Todos los datos han sido eliminados', 'warning');
                        })
                        .catch((err) => {
                          void this.mostrarToast(
                            getHttpErrorMessage(err, 'No se pudieron eliminar los datos'),
                            'danger'
                          );
                        });
                    } else {
                      void this.mostrarToast('Texto incorrecto, operación cancelada', 'medium');
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

  async mostrarToast(mensaje: string, color: string): Promise<void> {
    await presentIecaToast(this.toastController, mensaje, color, 2800);
  }
}
