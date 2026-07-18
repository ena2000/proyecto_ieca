import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ActividadAdmin, BackupIeca, ConfigIglesia, Ingreso, ResumenAdmin
} from '../core/models';
import { DataService } from './data.service';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { ApiService } from '../core/services/api.service';
import { API } from '../core/constants/api.constants';
import { ROLES } from '../core/constants/roles.constants';
import { environment } from '../../environments/environment';
import { getMesActualLabel, periodoKeyFromFecha } from '../shared/utils/month.util';
import { referenciaIngresoOrigen } from '../shared/utils/aportacion-iglesia.util';
import { CierreService } from '../core/services/cierre.service';
import {
  AUDITORIA_CSV_HEADERS,
  buildMapaNombresUsuarios,
  mapMovimientoAuditoriaCsvRow,
  parseFechaCsvParaOrden
} from '../shared/utils/auditoria-csv.util';

const ULTIMO_CIERRE_KEY = 'ultimoCierre';
const PERIODOS_CERRADOS_KEY = 'periodosCerrados';

const CONFIG_DEFAULT: ConfigIglesia = {
  nombre:        'Iglesia del Evangelio Cuadrangular "La Alborada"',
  periodoActual: '',
  version:       'v1.0.0'
};

@Injectable({ providedIn: 'root' })
export class AdministracionService {

  constructor(
    private dataService: DataService,
    private notificacionesService: NotificacionesService,
    private api: ApiService,
    private cierreService: CierreService
  ) {}

  async enviarResumenAlertasEmail(force = false): Promise<{
    skipped?: boolean;
    reason?: string;
    message?: string;
    mailResult?: { sent: boolean; channel: string };
    resumen?: { pendientes: unknown[]; cierre: { activo: boolean } };
  }> {
    return firstValueFrom(
      this.api.post(API.admin.alertasEnviar, { force })
    );
  }

  async cargarConfigRemota(): Promise<void> {
    try {
      await this.cierreService.cargar();
    } catch (err) {
      console.error('[AdministracionService] cargarConfigRemota:', err);
    }
  }

  getUltimoCierre(): string {
    return this.cierreService.getUltimoCierreLabel();
  }

  isMesActualCerrado(): boolean {
    return this.cierreService.isMesActualCerrado();
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
        accion: `Nuevo ingreso: ${this.etiquetaActividadIngreso(i, ingresos)}`,
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
    const periodoKey = periodoKeyFromFecha(new Date().toISOString());

    if (environment.useLocalFallback) {
      this.cierreService.aplicarCierreLocal(fechaCierre);
      const marcarMes = <T extends { fecha?: string; cerrado?: boolean; periodoCierre?: string }>(
        lista: T[]
      ): T[] =>
        lista.map(item => {
          if (periodoKey && periodoKeyFromFecha(item.fecha) === periodoKey) {
            return { ...item, cerrado: true, periodoCierre: periodoKey };
          }
          return item;
        });
      const ingresos = marcarMes(this.dataService.getIngresosActuales());
      const gastos   = marcarMes(this.dataService.getGastosActuales());
      localStorage.setItem('ingresos', JSON.stringify(ingresos));
      localStorage.setItem('gastos', JSON.stringify(gastos));
      await this.dataService.refreshAllData(true);
      this.dataService.notifyChanges();
      this.notificacionesService.registrar({
        audiencia: 'staff',
        origenRol: ROLES.ADMIN,
        tipo: 'cierre',
        titulo: 'Cierre financiero mensual',
        mensaje: `Se cerró el periodo ${fechaCierre}. Los movimientos del mes quedan congelados.`,
        ruta: '/administracion'
      });
      return;
    }

    const res = await firstValueFrom(
      this.api.post<{
        ultimoCierre: string;
        periodosCerrados: string[];
        mesActualCerrado?: boolean;
      }>(API.admin.cierre, { periodo: fechaCierre })
    );
    this.cierreService.sincronizarDesdeApi(res);
    await this.dataService.refreshAllData(true);
    this.dataService.notifyChanges();
    this.notificacionesService.registrar({
      audiencia: 'staff',
      origenRol: ROLES.ADMIN,
      tipo: 'cierre',
      titulo: 'Cierre financiero mensual',
      mensaje: `Se cerró el periodo ${fechaCierre}. Los movimientos del mes quedan congelados.`,
      ruta: '/administracion'
    });
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

  async descargarAuditoriaCsv(filters?: {
    tipo?: 'todos' | 'ingresos' | 'gastos';
    desde?: string; // YYYY-MM-DD
    hasta?: string; // YYYY-MM-DD
  }): Promise<void> {
    const stamp = new Date().toISOString().substring(0, 10);
    const filename = `auditoria_ieca_${stamp}.csv`;

    if (environment.useLocalFallback) {
      const csv = this.generarAuditoriaCsvLocal(filters);
      this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
      return;
    }

    const params: Record<string, string> = {
      tipo: filters?.tipo ?? 'todos'
    };

    const toDesde = (d?: string) => (d ? `${d}T00:00:00` : undefined);
    const toHasta = (d?: string) => (d ? `${d}T23:59:59.999` : undefined);

    const desde = toDesde(filters?.desde);
    const hasta = toHasta(filters?.hasta);
    if (desde) params['desde'] = desde;
    if (hasta) params['hasta'] = hasta;

    const blob = await firstValueFrom(this.api.getBlob(API.admin.auditoria, params));
    const csv = await blob.text();
    const lineas = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lineas.length <= 1) {
      throw new Error(
        'No hay registros para exportar. Revisa los filtros o registra ingresos/gastos con trazabilidad.'
      );
    }
    this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
  }

  async restaurarBackup(backup: BackupIeca): Promise<void> {
    if (environment.useLocalFallback) {
      this.restaurarBackupLocal(backup);
      return;
    }
    await firstValueFrom(this.api.post(API.admin.restore, backup));
    await this.cargarConfigRemota();
    await this.dataService.refreshAllData(true);
    await this.notificacionesService.recargarAsync();
  }

  async limpiarTodosLosDatos(password: string): Promise<void> {
    if (environment.useLocalFallback) {
      this.limpiarTodosLosDatosLocal();
      return;
    }
    await firstValueFrom(
      this.api.delete(API.admin.datos, {
        confirmacion: 'ELIMINAR',
        password
      })
    );
    this.cierreService.limpiarLocal();
    await this.dataService.refreshAllData(true);
    await this.notificacionesService.recargarAsync();
  }

  private crearBackupLocal(): BackupIeca {
    return {
      fecha:        new Date().toISOString(),
      version:      CONFIG_DEFAULT.version,
      ingresos:     this.dataService.getIngresosActuales(),
      gastos:       this.dataService.getGastosActuales(),
      ministerios:  this.dataService.getMinisteriosActuales(),
      usuarios:     this.dataService.getUsuariosActuales(),
      ultimoCierre: localStorage.getItem(ULTIMO_CIERRE_KEY),
      periodosCerrados: JSON.parse(localStorage.getItem(PERIODOS_CERRADOS_KEY) || '[]')
    };
  }

  private generarAuditoriaCsvLocal(filters?: {
    tipo?: 'todos' | 'ingresos' | 'gastos';
    desde?: string;
    hasta?: string;
  }): string {
    const tipo = filters?.tipo ?? 'todos';

    const desde = filters?.desde ? new Date(`${filters.desde}T00:00:00`) : null;
    const hasta = filters?.hasta ? new Date(`${filters.hasta}T23:59:59.999`) : null;

    const inRange = (item: { fecha?: string; fechaFormateada?: string }) => {
      let d: Date | null = null;
      if (item.fecha) {
        const parsed = new Date(item.fecha);
        if (!Number.isNaN(parsed.getTime())) d = parsed;
      }
      if (!d && item.fechaFormateada?.length === 10 && item.fechaFormateada.includes('/')) {
        const [dd, mm, yyyy] = item.fechaFormateada.split('/');
        const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        if (!Number.isNaN(parsed.getTime())) d = parsed;
      }
      if (!d) return true;
      if (desde && d < desde) return false;
      if (hasta && d > hasta) return false;
      return true;
    };

    const mapaUsuarios = buildMapaNombresUsuarios(this.dataService.getUsuariosActuales());

    const ingresos =
      tipo === 'todos' || tipo === 'ingresos'
        ? this.dataService.getIngresosActuales()
            .filter(i => inRange(i))
            .map(i =>
              mapMovimientoAuditoriaCsvRow(i as unknown as Record<string, unknown>, 'ingreso', mapaUsuarios)
            )
        : [];

    const gastos =
      tipo === 'todos' || tipo === 'gastos'
        ? this.dataService.getGastosActuales()
            .filter(g => inRange(g))
            .map(g =>
              mapMovimientoAuditoriaCsvRow(g as unknown as Record<string, unknown>, 'gasto', mapaUsuarios)
            )
        : [];

    const rows = [...ingresos, ...gastos].sort(
      (a, b) =>
        parseFechaCsvParaOrden(b['fechaFormateada'] as string) -
        parseFechaCsvParaOrden(a['fechaFormateada'] as string)
    );

    const headers = [...AUDITORIA_CSV_HEADERS];

    const escape = (v: any) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [headers.map(escape).join(',')];
    for (const r of rows) {
      lines.push(headers.map(h => escape(r[h])).join(','));
    }
    if (lines.length <= 1) {
      throw new Error(
        'No hay registros para exportar. Revisa los filtros o registra ingresos/gastos con trazabilidad.'
      );
    }
    return lines.join('\r\n');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private restaurarBackupLocal(backup: BackupIeca): void {
    if (backup.ingresos)    localStorage.setItem('ingresos', JSON.stringify(backup.ingresos));
    if (backup.gastos)      localStorage.setItem('gastos', JSON.stringify(backup.gastos));
    if (backup.ministerios) localStorage.setItem('ministerios', JSON.stringify(backup.ministerios));
    if (backup.usuarios)    localStorage.setItem('usuarios', JSON.stringify(backup.usuarios));
    if (backup.ultimoCierre) localStorage.setItem(ULTIMO_CIERRE_KEY, backup.ultimoCierre);
    if (backup.periodosCerrados) {
      localStorage.setItem(PERIODOS_CERRADOS_KEY, JSON.stringify(backup.periodosCerrados));
    }
    void this.cierreService.cargar();
    this.dataService.refreshAllData();
  }

  private limpiarTodosLosDatosLocal(): void {
    localStorage.removeItem('ingresos');
    localStorage.removeItem('gastos');
    localStorage.removeItem('ministerios');
    localStorage.removeItem('usuarios');
    localStorage.removeItem(ULTIMO_CIERRE_KEY);
    localStorage.removeItem(PERIODOS_CERRADOS_KEY);
    this.cierreService.limpiarLocal();
    this.dataService.refreshAllData();
  }

  private etiquetaActividadIngreso(ingreso: Ingreso, ingresos: Ingreso[]): string {
    if (ingreso.esAportacionIglesia && ingreso.ingresoOrigenId != null) {
      const origen = ingresos.find(x => Number(x.id) === Number(ingreso.ingresoOrigenId));
      const detalle = referenciaIngresoOrigen(origen ?? ingreso);
      const ministerio = origen?.ministerio || ingreso.ministerio || 'ministerio';
      return `Aportación de ${ministerio} (33%) — ${detalle}`;
    }
    return ingreso.descripcion?.trim() || 'Sin descripción';
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
