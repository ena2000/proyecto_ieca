import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, merge } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import {
  Ingreso, Gasto, Ministerio, Usuario, Movimiento, KPIs, MesData, KardexLinea,
  BootstrapResponse
} from '../core/models';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { API } from '../core/constants/api.constants';
import { environment } from '../../environments/environment';
import { isUnauthorizedHttpError } from '../shared/utils/error-message.util';
import { formatearISOaDDMMYYYY } from '../shared/utils/date.util';
import { etiquetaCuentaReporte } from '../shared/utils/reportes-cuenta.util';
import { IngresosService } from './ingresos.service';
import { GastosService } from './gastos.service';
import { MinisteriosService } from './ministerios.service';
import { UsuariosService } from './usuarios.service';
import { gastoAprobado, gastoPendiente } from '../shared/utils/gasto.util';
import { ingresoAprobado, ingresoPendiente } from '../shared/utils/ingreso.util';
import { mesCortoEs } from '../shared/utils/month.util';
import { resolverNombreMinisterio } from '../shared/utils/movimiento-ministerio.util';
import { filtrarMinisteriosCatalogo, filtrarMinisteriosRegistroManual, filtrarMinisteriosReportes } from '../shared/constants/ministerios-catalogo.constants';
import {
  AportacionMinisterioResumen,
  calcularMontoAportacionIngreso,
  calcularMontoNetoMinisterio
} from '../shared/utils/aportacion-iglesia.util';

export type {
  Ingreso, Gasto, Ministerio, Usuario, Movimiento, KPIs, MesData, KardexLinea
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class DataService {
  private ingresosSubject = new BehaviorSubject<Ingreso[]>([]);
  private gastosSubject = new BehaviorSubject<Gasto[]>([]);
  private ministeriosSubject = new BehaviorSubject<Ministerio[]>([]);
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);

  ingresos$ = this.ingresosSubject.asObservable();
  gastos$ = this.gastosSubject.asObservable();
  ministerios$ = this.ministeriosSubject.asObservable();
  usuarios$ = this.usuariosSubject.asObservable();

  private readonly dataRevisionSubject = new BehaviorSubject<number>(0);
  readonly dataRevision$ = this.dataRevisionSubject.asObservable();

  private syncTimer: ReturnType<typeof setTimeout> | undefined;
  private bootstrapInFlight: Promise<boolean> | null = null;
  private bootstrapComplete = false;
  private lastBootstrapAt = 0;
  private readonly bootstrapTtlMs = 300_000;
  private readonly bootstrapStorageTtlMs = 600_000;
  private hydratingBootstrap = false;
  private readonly saldoMinisterioCache = new Map<number, number>();
  private lastIngresosRef: Ingreso[] | null = null;
  private lastGastosRef: Gasto[] | null = null;
  private lastMinisteriosRef: Ministerio[] | null = null;
  private lastUsuariosRef: Usuario[] | null = null;

  constructor(
    private ingresosService: IngresosService,
    private gastosService: GastosService,
    private ministeriosService: MinisteriosService,
    private usuariosService: UsuariosService,
    private authService: AuthService,
    private api: ApiService,
    private notificacionesService: NotificacionesService
  ) {
    merge(
      this.ingresosService.ingresos$,
      this.gastosService.gastos$,
      this.ministeriosService.ministerios$,
      this.usuariosService.usuarios$
    ).subscribe(() => this.scheduleSync());
    this.syncFromEntityServices();

    this.authService.session$
      .pipe(distinctUntilChanged((a, b) => (a?.id ?? null) === (b?.id ?? null)))
      .subscribe(session => {
        if (session) {
          if (!this.bootstrapComplete) {
            void this.bootstrapRemote();
          }
          return;
        }
        this.clearRemoteCache();
      });
  }

  private scheduleSync(): void {
    if (this.hydratingBootstrap) return;
    if (this.syncTimer != null) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = undefined;
      this.syncFromEntityServices();
    }, 50);
  }

  notifyChanges(): void {
    this.syncFromEntityServices();
    this.persistBootstrapSnapshot();
  }

  refreshAllData(force = false): void {
    if (environment.useLocalFallback) {
      this.ingresosService.reload();
      this.gastosService.reload();
      this.ministeriosService.reload();
      this.usuariosService.reload();
      return;
    }
    if (force) {
      this.bootstrapComplete = false;
      this.lastBootstrapAt = 0;
      this.clearBootstrapStorage();
    }
    void this.bootstrapRemote(force);
  }

  /** Recarga movimientos y notificaciones en paralelo (sin bootstrap completo). */
  refreshFinanzas(): Promise<void> {
    if (environment.useLocalFallback) {
      this.ingresosService.reload();
      this.gastosService.reload();
      this.notificacionesService.recargar();
      this.syncFromEntityServices();
      return Promise.resolve();
    }
    return Promise.all([
      this.ingresosService.reloadAsync(),
      this.gastosService.reloadAsync(),
      this.notificacionesService.recargarAsync()
    ])
      .then(() => this.syncFromEntityServices())
      .catch(err => console.error('[DataService] refreshFinanzas:', err));
  }

  hasRemoteData(): boolean {
    if (this.bootstrapComplete) {
      return true;
    }
    return (
      this.getIngresosActuales().length > 0 ||
      this.getGastosActuales().length > 0 ||
      this.getMinisteriosActuales().length > 0 ||
      this.getUsuariosActuales().length > 0
    );
  }

  /** Una sola petición HTTP para ingresos, gastos, notificaciones, etc. */
  bootstrapRemote(force = false): Promise<boolean> {
    if (environment.useLocalFallback || !this.authService.isAuthenticated()) {
      return Promise.resolve(true);
    }

    const memoryFresh = !force && this.bootstrapComplete &&
      Date.now() - this.lastBootstrapAt < this.bootstrapTtlMs;
    if (memoryFresh) {
      this.syncFromEntityServices();
      return Promise.resolve(true);
    }

    if (!force) {
      const stored = this.readBootstrapStorage();
      if (stored) {
        this.applyBootstrap(stored.payload);
        // Siempre reconciliar con el servidor (evita lista vieja tras F5).
        void this.fetchBootstrapFromApi(false);
        return Promise.resolve(true);
      }
    }

    return this.fetchBootstrapFromApi(force);
  }

  private fetchBootstrapFromApi(force = false): Promise<boolean> {
    if (this.bootstrapInFlight) {
      return this.bootstrapInFlight;
    }

    this.bootstrapInFlight = firstValueFrom(
      this.api.get<BootstrapResponse>(API.bootstrap)
    )
      .then(payload => {
        this.applyBootstrap(payload);
        this.writeBootstrapStorage(payload);
        return true;
      })
      .catch(err => {
        if (isUnauthorizedHttpError(err)) {
          this.authService.logout();
          return false;
        }
        console.error('[DataService] bootstrapRemote:', err);
        if (this.authService.isAuthenticated() && !this.hasRemoteData()) {
          this.fallbackReload();
        }
        return false;
      })
      .finally(() => {
        this.bootstrapInFlight = null;
      });

    return this.bootstrapInFlight;
  }

  private bootstrapStorageKey(): string {
    const id = this.authService.getSession()?.id ?? '0';
    return `ieca_bootstrap_${id}`;
  }

  private readBootstrapStorage(): { payload: BootstrapResponse; at: number } | null {
    try {
      const raw = sessionStorage.getItem(this.bootstrapStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { at: number; payload: BootstrapResponse };
      if (Date.now() - parsed.at > this.bootstrapStorageTtlMs) {
        sessionStorage.removeItem(this.bootstrapStorageKey());
        return null;
      }
      return { payload: parsed.payload, at: parsed.at };
    } catch {
      return null;
    }
  }

  private writeBootstrapStorage(payload: BootstrapResponse): void {
    try {
      sessionStorage.setItem(
        this.bootstrapStorageKey(),
        JSON.stringify({ at: Date.now(), payload })
      );
    } catch {
      this.clearBootstrapStorage();
    }
  }

  /**
   * Tras crear/editar/eliminar, guarda en sessionStorage la lista actual
   * para que un F5 no muestre datos viejos mientras llega el bootstrap.
   */
  private persistBootstrapSnapshot(): void {
    if (environment.useLocalFallback || !this.authService.isAuthenticated()) {
      return;
    }
    const prev = this.readBootstrapStorage()?.payload ?? {};
    const payload: BootstrapResponse = {
      ...prev,
      ingresos: this.movimientosParaBootstrapSnapshot(this.ingresosService.getAll()),
      gastos: this.movimientosParaBootstrapSnapshot(this.gastosService.getAll()),
      ministerios: this.ministeriosService.getAll()
    };
    if (this.authService.isAdministrador()) {
      payload.usuarios = this.usuariosService.getAll();
    }
    this.writeBootstrapStorage(payload);
    this.bootstrapComplete = true;
    this.lastBootstrapAt = Date.now();
  }

  /** Omite comprobantes base64 del snapshot (sessionStorage tiene límite de tamaño). */
  private movimientosParaBootstrapSnapshot<T extends Ingreso | Gasto>(items: T[]): T[] {
    return items.map(item => ({ ...item, foto: '' }));
  }

  private clearBootstrapStorage(): void {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('ieca_bootstrap_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch { /* ignore */ }
  }

  private applyBootstrap(payload: BootstrapResponse): void {
    this.hydratingBootstrap = true;
    try {
      if (payload.ingresos) this.ingresosService.hydrate(payload.ingresos);
      if (payload.gastos) this.gastosService.hydrate(payload.gastos);
      if (payload.ministerios) this.ministeriosService.hydrate(payload.ministerios);
      if (payload.usuarios) this.usuariosService.hydrate(payload.usuarios);
      if (payload.notificaciones) this.notificacionesService.hydrate(payload.notificaciones);
      this.bootstrapComplete = true;
      this.lastBootstrapAt = Date.now();
      this.syncFromEntityServices();
    } finally {
      this.hydratingBootstrap = false;
    }
  }

  private fallbackReload(): void {
    this.ingresosService.reload();
    this.gastosService.reload();
    this.ministeriosService.reload();
    this.usuariosService.reload();
    this.notificacionesService.recargar();
  }

  private clearRemoteCache(): void {
    this.bootstrapComplete = false;
    this.lastBootstrapAt = 0;
    this.lastIngresosRef = null;
    this.lastGastosRef = null;
    this.lastMinisteriosRef = null;
    this.lastUsuariosRef = null;
    this.saldoMinisterioCache.clear();
    this.clearBootstrapStorage();
    this.ingresosService.hydrate([]);
    this.gastosService.hydrate([]);
    this.ministeriosService.hydrate([]);
    this.usuariosService.hydrate([]);
    this.notificacionesService.hydrate([]);
    this.syncFromEntityServices();
  }

  private syncFromEntityServices(): void {
    const ingresos = this.ingresosService.getAll();
    const gastos = this.gastosService.getAll();
    const ministerios = this.ministeriosService.getAll();
    const usuarios = this.usuariosService.getAll();

    if (
      ingresos === this.lastIngresosRef &&
      gastos === this.lastGastosRef &&
      ministerios === this.lastMinisteriosRef &&
      usuarios === this.lastUsuariosRef
    ) {
      return;
    }

    this.lastIngresosRef = ingresos;
    this.lastGastosRef = gastos;
    this.lastMinisteriosRef = ministerios;
    this.lastUsuariosRef = usuarios;
    this.saldoMinisterioCache.clear();

    this.ingresosSubject.next([...ingresos]);
    this.gastosSubject.next([...gastos]);
    this.ministeriosSubject.next([...ministerios]);
    this.usuariosSubject.next([...usuarios]);
    this.dataRevisionSubject.next(this.dataRevisionSubject.getValue() + 1);
  }

  getIngresos(): Observable<Ingreso[]> { return this.ingresos$; }
  getGastos(): Observable<Gasto[]> { return this.gastos$; }
  getMinisterios(): Observable<Ministerio[]> { return this.ministerios$; }
  getUsuarios(): Observable<Usuario[]> { return this.usuarios$; }

  getIngresosActuales(): Ingreso[] { return this.ingresosSubject.getValue(); }
  getGastosActuales(): Gasto[] { return this.gastosSubject.getValue(); }
  getMinisteriosActuales(): Ministerio[] { return this.ministeriosSubject.getValue(); }
  /** Ministerios para formularios y asignación (sin Contabilidad ni General). */
  getMinisteriosParaCatalogo(): Ministerio[] {
    return filtrarMinisteriosRegistroManual(this.getMinisteriosActuales());
  }
  /** Ministerios en reportes y gráficos (incluye General; sin Contabilidad). */
  getMinisteriosParaReportes(): Ministerio[] {
    return filtrarMinisteriosReportes(this.getMinisteriosActuales());
  }
  getUsuariosActuales(): Usuario[] { return this.usuariosSubject.getValue(); }

  private gastosAprobadosParaBalance(gastos: Gasto[]): Gasto[] {
    return gastos.filter(gastoAprobado);
  }

  private ingresosAprobadosParaBalance(ingresos: Ingreso[]): Ingreso[] {
    return ingresos.filter(ingresoAprobado);
  }

  private filterPorMinisterio<T extends { ministerioId?: number }>(
    items: T[],
    ministerioId?: number
  ): T[] {
    if (ministerioId == null) return items;
    return items.filter(i => Number(i.ministerioId) === ministerioId);
  }

  /** Ingreso efectivo para balances: ministerio neto (67%) o aportación iglesia (33%). */
  private montoIngresoParaBalance(ingreso: Ingreso): number {
    if (ingreso.esAportacionIglesia) return ingreso.monto || 0;
    if (ingreso.ministerioId != null) return calcularMontoNetoMinisterio(ingreso);
    return ingreso.monto || 0;
  }

  calcularKPIs(ministerioId?: number): KPIs {
    const ingresos = this.ingresosAprobadosParaBalance(
      this.filterPorMinisterio(this.getIngresosActuales(), ministerioId)
    );
    const gastos = this.gastosAprobadosParaBalance(
      this.filterPorMinisterio(this.getGastosActuales(), ministerioId)
    );
    const ministerios = this.getMinisteriosActuales();

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const ingresosDelMes = ingresos.filter(i => {
      const fecha = new Date(i.fecha);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    const gastosDelMes = gastos.filter(g => {
      const fecha = new Date(g.fecha);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    const totalIngresos = ingresosDelMes.reduce((sum, i) => sum + this.montoIngresoParaBalance(i), 0);
    const totalGastos = gastosDelMes.reduce((sum, g) => sum + (g.monto || 0), 0);
    const balance = totalIngresos - totalGastos;

    const ministeriosActivos = ministerioId != null
      ? (ministerios.some(m => Number(m.id) === ministerioId && m.estado === 'Activo') ? 1 : 0)
      : filtrarMinisteriosReportes(ministerios).filter(m => m.estado === 'Activo').length;

    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const mesAnteriorNum = mesAnterior.getMonth();
    const anioAnterior = mesAnterior.getFullYear();

    const ingresosAnterior = ingresos
      .filter(i => {
        const fecha = new Date(i.fecha);
        return fecha.getMonth() === mesAnteriorNum && fecha.getFullYear() === anioAnterior;
      })
      .reduce((sum, i) => sum + this.montoIngresoParaBalance(i), 0);

    const gastosAnterior = gastos
      .filter(g => {
        const fecha = new Date(g.fecha);
        return fecha.getMonth() === mesAnteriorNum && fecha.getFullYear() === anioAnterior;
      })
      .reduce((sum, g) => sum + (g.monto || 0), 0);

    const tendenciaIngresos = this.calcularTendenciaMensual(totalIngresos, ingresosAnterior);
    const tendenciaGastos = this.calcularTendenciaMensual(totalGastos, gastosAnterior);

    return {
      balance,
      ingresos: totalIngresos,
      gastosMes: totalGastos,
      ministeriosActivos: ministeriosActivos || 0,
      tendenciaIngresos,
      tendenciaGastos,
      superavit: balance,
      transacciones: ingresosDelMes.length + gastosDelMes.length
    };
  }

  getUltimosMovimientos(cantidad: number = 5, ministerioId?: number): Movimiento[] {
    const ingresos = this.ingresosAprobadosParaBalance(
      this.filterPorMinisterio(this.getIngresosActuales(), ministerioId)
    );
    const gastos = this.gastosAprobadosParaBalance(
      this.filterPorMinisterio(this.getGastosActuales(), ministerioId)
    );
    const ministerios = this.getMinisteriosActuales();

    const movimientos = [
      ...ingresos.map(i => ({
        tipo: 'ingreso' as const,
        titulo: i.descripcion,
        ministerio: resolverNombreMinisterio(i.ministerioId, i.ministerio, ministerios, {
          esAportacionIglesia: i.esAportacionIglesia
        }),
        monto: this.montoIngresoParaBalance(i),
        fecha: this.formatearFecha(i.fecha),
        fechaOrden: new Date(i.fecha).getTime()
      })),
      ...gastos.map(g => ({
        tipo: 'gasto' as const,
        titulo: g.descripcion,
        ministerio: resolverNombreMinisterio(g.ministerioId, g.ministerio, ministerios),
        monto: g.monto || 0,
        fecha: this.formatearFecha(g.fecha),
        fechaOrden: new Date(g.fecha).getTime()
      }))
    ];

    return movimientos
      .sort((a, b) => b.fechaOrden - a.fechaOrden)
      .slice(0, cantidad)
      .map(({ fechaOrden, ...mov }) => mov);
  }

  getChartData(ministerioId?: number): MesData[] {
    const ingresos = this.ingresosAprobadosParaBalance(
      this.filterPorMinisterio(this.getIngresosActuales(), ministerioId)
    );
    const gastos = this.gastosAprobadosParaBalance(
      this.filterPorMinisterio(this.getGastosActuales(), ministerioId)
    );
    const ahora = new Date();
    const chartData: MesData[] = [];

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mes = fecha.getMonth();
      const anio = fecha.getFullYear();

      const ingresosDelMes = ingresos
        .filter(ing => {
          const f = new Date(ing.fecha);
          return f.getMonth() === mes && f.getFullYear() === anio;
        })
        .reduce((sum, ing) => sum + this.montoIngresoParaBalance(ing), 0);

      const gastosDelMes = gastos
        .filter(g => {
          const f = new Date(g.fecha);
          return f.getMonth() === mes && f.getFullYear() === anio;
        })
        .reduce((sum, g) => sum + (g.monto || 0), 0);

      chartData.push({
        mes: mesCortoEs(fecha.getMonth()),
        ingresos: ingresosDelMes,
        gastos: gastosDelMes
      });
    }

    return chartData;
  }

  getDistribucionMinisterios(ministerioId?: number): Array<{ nombre: string; color: string; monto: number; porcentaje: number }> {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const ingresos = this.ingresosAprobadosParaBalance(
      this.filterPorMinisterio(this.getIngresosActuales(), ministerioId)
    ).filter(i => {
      const f = new Date(i.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    });

    const ministerios = ministerioId != null
      ? this.getMinisteriosActuales().filter(m => Number(m.id) === ministerioId)
      : this.getMinisteriosParaReportes();

    const coloresDefault = ['#1e3a8a', '#7c3aed', '#0891b2', '#059669', '#dc2626', '#ea580c'];
    const distribucion = new Map<string, number>();

    ministerios.forEach(m => distribucion.set(m.nombre, 0));
    if (!distribucion.has('General')) distribucion.set('General', 0);

    ingresos.forEach(i => {
      const min = resolverNombreMinisterio(i.ministerioId, i.ministerio, ministerios, {
        esAportacionIglesia: i.esAportacionIglesia
      });
      distribucion.set(min, (distribucion.get(min) || 0) + this.montoIngresoParaBalance(i));
    });

    const total = Array.from(distribucion.values()).reduce((a, b) => a + b, 0);
    return Array.from(distribucion.entries())
      .filter(entry => entry[1] > 0)
      .map((entry, idx) => ({
        nombre: entry[0],
        color: coloresDefault[idx % coloresDefault.length],
        monto: entry[1],
        porcentaje: total > 0 ? Math.round((entry[1] / total) * 100) : 0
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);
  }

  calcularSaldoMinisterio(ministerioId: number): number {
    const cached = this.saldoMinisterioCache.get(ministerioId);
    if (cached !== undefined) return cached;

    const kardex = this.getKardexMinisterio(ministerioId);
    const saldo = kardex.length ? kardex[kardex.length - 1].saldo : 0;
    this.saldoMinisterioCache.set(ministerioId, saldo);
    return saldo;
  }

  /**
   * Suma la aportación del 33% (ingresos de talento aprobados) por ministerio.
   * @param mes Clave `YYYY-MM` para acotar al período; omitir para histórico acumulado.
   */
  getAportacionIglesiaPorMinisterio(
    mes?: string | null,
    ministerioScopeId?: number | null
  ): AportacionMinisterioResumen[] {
    const ministerios = ministerioScopeId != null
      ? this.getMinisteriosActuales().filter(m => Number(m.id) === ministerioScopeId)
      : this.getMinisteriosParaCatalogo();

    const porId = new Map<number, number>();
    ministerios.forEach(m => porId.set(m.id, 0));

    this.ingresosAprobadosParaBalance(this.getIngresosActuales())
      .filter(i => i.ministerioId != null && !i.esAportacionIglesia)
      .filter(i => mes == null || mes === '' || i.fecha.startsWith(mes))
      .forEach(i => {
        const id = Number(i.ministerioId);
        if (!porId.has(id)) return;
        porId.set(id, (porId.get(id) || 0) + calcularMontoAportacionIngreso(i));
      });

    return ministerios
      .map(m => ({
        ministerioId: m.id,
        nombre: m.nombre,
        aportacion: porId.get(m.id) || 0
      }))
      .sort((a, b) => b.aportacion - a.aportacion);
  }

  getTotalAportacionIglesia(mes?: string | null, ministerioScopeId?: number | null): number {
    return this.getAportacionIglesiaPorMinisterio(mes, ministerioScopeId)
      .reduce((sum, row) => sum + row.aportacion, 0);
  }

  getKardexMinisterio(ministerioId: number): KardexLinea[] {
    const ingresos = this.ingresosAprobadosParaBalance(
      this.getIngresosActuales().filter(i => Number(i.ministerioId) === ministerioId)
    );
    const gastos = this.gastosAprobadosParaBalance(
      this.getGastosActuales().filter(g => Number(g.ministerioId) === ministerioId)
    );

    const movimientos = [
      ...ingresos.map(i => ({
        fecha: i.fecha,
        descripcion: i.descripcion,
        cuentaCodigo: i.cuentaCodigo,
        cuentaNombre: i.cuentaNombre || i.categoria,
        tipo: 'ingreso' as const,
        monto: calcularMontoNetoMinisterio(i)
      })),
      ...gastos.map(g => ({
        fecha: g.fecha,
        descripcion: g.descripcion,
        cuentaCodigo: g.cuentaCodigo,
        cuentaNombre: g.cuentaNombre || g.categoria,
        tipo: 'gasto' as const,
        monto: g.monto || 0
      }))
    ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let saldo = 0;
    return movimientos.map(m => {
      const ingreso = m.tipo === 'ingreso' ? m.monto : 0;
      const gasto = m.tipo === 'gasto' ? m.monto : 0;
      saldo += ingreso - gasto;
      return {
        fecha: m.fecha,
        fechaFormateada: formatearISOaDDMMYYYY(m.fecha),
        descripcion: m.descripcion,
        cuentaEtiqueta: etiquetaCuentaReporte({
          cuentaCodigo: m.cuentaCodigo,
          cuentaNombre: m.cuentaNombre,
          tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'
        }),
        tipo: m.tipo,
        ingreso,
        gasto,
        saldo
      };
    });
  }

  getConteoPendientes(ministerioId?: number): { ingresos: number; gastos: number; total: number } {
    const ingresos = this.filterPorMinisterio(this.getIngresosActuales(), ministerioId)
      .filter(ingresoPendiente).length;
    const gastos = this.filterPorMinisterio(this.getGastosActuales(), ministerioId)
      .filter(gastoPendiente).length;
    return { ingresos, gastos, total: ingresos + gastos };
  }

  /**
   * Variación % mes actual vs mes anterior.
   * Si el mes pasado era 0 y este mes hay monto, se registra como +100 % (subió).
   */
  private calcularTendenciaMensual(actual: number, anterior: number): string {
    if (anterior === 0) return actual > 0 ? '100%' : '0%';
    return ((actual - anterior) / anterior * 100).toFixed(0) + '%';
  }

  private formatearFecha(fecha: string): string {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const fecha_obj = new Date(fecha);

    if (fecha_obj.toDateString() === hoy.toDateString()) return 'Hoy';
    if (fecha_obj.toDateString() === ayer.toDateString()) return 'Ayer';
    return fecha_obj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }
}
