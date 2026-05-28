import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ActividadAdmin, BackupIeca, ConfigIglesia, ResumenAdmin
} from '../core/models';
import { DataService } from './data.service';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { getMesActualLabel } from '../shared/utils/month.util';

const ULTIMO_CIERRE_KEY = 'ultimoCierre';

const CONFIG_DEFAULT: ConfigIglesia = {
  nombre:        'Iglesia Evangélica La Alborada',
  periodoActual: '',
  version:       'v1.0.0'
};

@Injectable({ providedIn: 'root' })
export class AdministracionService {

  private ultimoCierreApi: string | null = null;

  constructor(
    private dataService: DataService,
    private notificacionesService: NotificacionesService,
    private api: ApiService
  ) {}

  async cargarConfigRemota(): Promise<void> {
    if (environment.useLocalFallback) return;
    try {
      const cfg = await firstValueFrom(
        this.api.get<{ ultimoCierre: string | null }>(API.admin.config)
      );
      this.ultimoCierreApi = cfg.ultimoCierre;
    } catch (err) {
      console.error('[AdministracionService] cargarConfigRemota:', err);
    }
  }

  getUltimoCierre(): string {
    if (!environment.useLocalFallback) {
      return this.ultimoCierreApi ?? 'N/A';
    }
    return localStorage.getItem(ULTIMO_CIERRE_KEY) || 'N/A';
  }

  getConfigIglesia(): ConfigIglesia {
    return {
      ...CONFIG_DEFAULT,
      periodoActual: getMesActualLabel()
    };
  }

  getResumen(): ResumenAdmin[] {
    const kpis         = this.dataService.calcularKPIs();
    const usuarios     = this.dataService.getUsuariosActuales();
    const mesActual    = getMesActualLabel();
    const ultimoCierre = this.getUltimoCierre();

    return [
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
      }
    ];
  }

  getActividadReciente(): ActividadAdmin[] {
    const ingresos    = this.dataService.getIngresosActuales();
    const gastos      = this.dataService.getGastosActuales();
    const usuarios    = this.dataService.getUsuariosActuales();
    const ministerios = this.dataService.getMinisteriosActuales();
    const actividades: ActividadAdmin[] = [];

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

  async ejecutarCierreMes(): Promise<void> {
    const fechaCierre = getMesActualLabel();

    this.notificacionesService.registrar({
      tipo: 'cierre',
      titulo: 'Cierre financiero mensual',
      mensaje: `Se cerró el periodo ${fechaCierre}. Los movimientos del mes quedan congelados.`,
      ruta: '/administracion'
    });

    if (environment.useLocalFallback) {
      localStorage.setItem(ULTIMO_CIERRE_KEY, fechaCierre);
      const ingresos = this.dataService.getIngresosActuales().map(i => ({ ...i, cerrado: true }));
      const gastos   = this.dataService.getGastosActuales().map(g => ({ ...g, cerrado: true }));
      localStorage.setItem('ingresos', JSON.stringify(ingresos));
      localStorage.setItem('gastos', JSON.stringify(gastos));
      this.dataService.refreshAllData();
      this.dataService.notifyChanges();
      return;
    }

    await firstValueFrom(
      this.api.post<{ ultimoCierre: string }>(API.admin.cierre, { periodo: fechaCierre })
    );
    this.ultimoCierreApi = fechaCierre;
    this.dataService.refreshAllData();
    this.dataService.notifyChanges();
  }

  async crearBackup(): Promise<BackupIeca> {
    if (environment.useLocalFallback) {
      return this.crearBackupLocal();
    }
    return firstValueFrom(this.api.get<BackupIeca>(API.admin.backup));
  }

  descargarBackup(backup: BackupIeca): void {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `backup_ieca_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async restaurarBackup(backup: BackupIeca): Promise<void> {
    if (environment.useLocalFallback) {
      this.restaurarBackupLocal(backup);
      return;
    }
    await firstValueFrom(this.api.post(API.admin.restore, backup));
    await this.cargarConfigRemota();
    this.dataService.refreshAllData();
    this.notificacionesService.recargar();
  }

  async limpiarTodosLosDatos(): Promise<void> {
    if (environment.useLocalFallback) {
      this.limpiarTodosLosDatosLocal();
      return;
    }
    await firstValueFrom(this.api.delete(API.admin.datos));
    this.ultimoCierreApi = null;
    this.dataService.refreshAllData();
    this.notificacionesService.recargar();
  }

  private crearBackupLocal(): BackupIeca {
    return {
      fecha:        new Date().toISOString(),
      version:      CONFIG_DEFAULT.version,
      ingresos:     this.dataService.getIngresosActuales(),
      gastos:       this.dataService.getGastosActuales(),
      ministerios:  this.dataService.getMinisteriosActuales(),
      usuarios:     this.dataService.getUsuariosActuales(),
      ultimoCierre: localStorage.getItem(ULTIMO_CIERRE_KEY)
    };
  }

  private restaurarBackupLocal(backup: BackupIeca): void {
    if (backup.ingresos)    localStorage.setItem('ingresos', JSON.stringify(backup.ingresos));
    if (backup.gastos)      localStorage.setItem('gastos', JSON.stringify(backup.gastos));
    if (backup.ministerios) localStorage.setItem('ministerios', JSON.stringify(backup.ministerios));
    if (backup.usuarios)    localStorage.setItem('usuarios', JSON.stringify(backup.usuarios));
    if (backup.ultimoCierre) localStorage.setItem(ULTIMO_CIERRE_KEY, backup.ultimoCierre);
    this.dataService.refreshAllData();
  }

  private limpiarTodosLosDatosLocal(): void {
    localStorage.removeItem('ingresos');
    localStorage.removeItem('gastos');
    localStorage.removeItem('ministerios');
    localStorage.removeItem('usuarios');
    localStorage.removeItem(ULTIMO_CIERRE_KEY);
    this.dataService.refreshAllData();
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
}
