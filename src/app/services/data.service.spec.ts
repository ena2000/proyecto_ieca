import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { DataService } from './data.service';
import { IngresosService } from './ingresos.service';
import { GastosService } from './gastos.service';
import { MinisteriosService } from './ministerios.service';
import { UsuariosService } from './usuarios.service';
import { AuthService } from '../core/services/auth.service';
import { NotificacionesService } from '../core/services/notificaciones.service';
import { Ingreso, Gasto, Ministerio } from '../core/models';

function isoEnMesActual(dia: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), dia, 12, 0, 0).toISOString();
}

function crearMocks() {
  let ingresos: Ingreso[] = [];
  let gastos: Gasto[] = [];
  let ministerios: Ministerio[] = [];

  const ingresosSubject = new BehaviorSubject<Ingreso[]>([]);
  const gastosSubject = new BehaviorSubject<Gasto[]>([]);
  const ministeriosSubject = new BehaviorSubject<Ministerio[]>([]);
  const usuariosSubject = new BehaviorSubject<unknown[]>([]);

  const ingresosService = {
    ingresos$: ingresosSubject.asObservable(),
    getAll: () => ingresos,
    reload: jasmine.createSpy('reloadIngresos'),
    hydrate: (lista: Ingreso[]) => {
      ingresos = lista;
      ingresosSubject.next(ingresos);
    }
  };
  const gastosService = {
    gastos$: gastosSubject.asObservable(),
    getAll: () => gastos,
    reload: jasmine.createSpy('reloadGastos'),
    hydrate: (lista: Gasto[]) => {
      gastos = lista;
      gastosSubject.next(gastos);
    }
  };
  const ministeriosService = {
    ministerios$: ministeriosSubject.asObservable(),
    getAll: () => ministerios,
    reload: jasmine.createSpy('reloadMinisterios'),
    hydrate: (lista: Ministerio[]) => {
      ministerios = lista;
      ministeriosSubject.next(ministerios);
    }
  };
  const usuariosService = {
    usuarios$: usuariosSubject.asObservable(),
    getAll: () => [],
    reload: jasmine.createSpy('reloadUsuarios'),
    hydrate: jasmine.createSpy('hydrateUsuarios')
  };

  return {
    ingresosService,
    gastosService,
    ministeriosService,
    usuariosService,
    seed( data: { ingresos?: Ingreso[]; gastos?: Gasto[]; ministerios?: Ministerio[] }) {
      if (data.ingresos) {
        ingresos = data.ingresos;
        ingresosSubject.next(ingresos);
      }
      if (data.gastos) {
        gastos = data.gastos;
        gastosSubject.next(gastos);
      }
      if (data.ministerios) {
        ministerios = data.ministerios;
        ministeriosSubject.next(ministerios);
      }
    }
  };
}

describe('DataService', () => {
  let service: DataService;
  let mocks: ReturnType<typeof crearMocks>;

  beforeEach(() => {
    mocks = crearMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DataService,
        { provide: IngresosService, useValue: mocks.ingresosService },
        { provide: GastosService, useValue: mocks.gastosService },
        { provide: MinisteriosService, useValue: mocks.ministeriosService },
        { provide: UsuariosService, useValue: mocks.usuariosService },
        {
          provide: AuthService,
          useValue: { session$: new BehaviorSubject(null).asObservable() }
        },
        {
          provide: NotificacionesService,
          useValue: {
            lista$: new BehaviorSubject([]).asObservable(),
            hydrate: jasmine.createSpy('hydrateNotificaciones'),
            recargar: jasmine.createSpy('recargarNotificaciones')
          }
        }
      ]
    });
    service = TestBed.inject(DataService);
  });

  function sync(): void {
    service.notifyChanges();
  }

  it('calcularKPIs solo suma ingresos y gastos aprobados del mes actual', () => {
    mocks.seed({
      ingresos: [
        { id: 1, fecha: isoEnMesActual(5), descripcion: 'Ofrenda', monto: 1000, foto: '', categoria: 'Ofrenda', ministerio: 'Gen', estado: 'aprobado' },
        { id: 2, fecha: isoEnMesActual(6), descripcion: 'Pendiente', monto: 500, foto: '', categoria: 'Otro', ministerio: 'Gen', estado: 'pendiente' }
      ],
      gastos: [
        { id: 1, fecha: isoEnMesActual(7), descripcion: 'Gasto ok', monto: 200, foto: '', categoria: 'Servicios', estado: 'aprobado' },
        { id: 2, fecha: isoEnMesActual(8), descripcion: 'Gasto pend', monto: 999, foto: '', categoria: 'Otros', estado: 'pendiente' }
      ],
      ministerios: [{ id: 1, nombre: 'Jóvenes', estado: 'Activo' }]
    });
    sync();

    const kpis = service.calcularKPIs();
    expect(kpis.ingresos).toBe(1000);
    expect(kpis.gastosMes).toBe(200);
    expect(kpis.balance).toBe(800);
    expect(kpis.transacciones).toBe(2);
  });

  it('calcularKPIs filtra por ministerioId', () => {
    mocks.seed({
      ingresos: [
        { id: 1, fecha: isoEnMesActual(3), descripcion: 'A', monto: 100, foto: '', categoria: 'O', ministerio: 'M1', ministerioId: 1, estado: 'aprobado' },
        { id: 2, fecha: isoEnMesActual(4), descripcion: 'B', monto: 300, foto: '', categoria: 'O', ministerio: 'M2', ministerioId: 2, estado: 'aprobado' }
      ],
      gastos: [],
      ministerios: [
        { id: 1, nombre: 'M1', estado: 'Activo' },
        { id: 2, nombre: 'M2', estado: 'Activo' }
      ]
    });
    sync();

    const kpis = service.calcularKPIs(1);
    expect(kpis.ingresos).toBe(100);
    expect(kpis.ministeriosActivos).toBe(1);
  });

  it('getConteoPendientes cuenta ingresos y gastos pendientes', () => {
    mocks.seed({
      ingresos: [
        { id: 1, fecha: isoEnMesActual(1), descripcion: 'P1', monto: 10, foto: '', categoria: 'O', ministerio: 'G', estado: 'pendiente' },
        { id: 2, fecha: isoEnMesActual(2), descripcion: 'A1', monto: 10, foto: '', categoria: 'O', ministerio: 'G', estado: 'aprobado' }
      ],
      gastos: [
        { id: 1, fecha: isoEnMesActual(3), descripcion: 'P2', monto: 10, foto: '', categoria: 'X', estado: 'pendiente' }
      ]
    });
    sync();

    expect(service.getConteoPendientes()).toEqual({ ingresos: 1, gastos: 1, total: 2 });
  });

  it('getConteoPendientes respeta alcance de ministerio', () => {
    mocks.seed({
      ingresos: [
        { id: 1, fecha: isoEnMesActual(1), descripcion: 'P min1', monto: 1, foto: '', categoria: 'O', ministerioId: 1, ministerio: 'M1', estado: 'pendiente' },
        { id: 2, fecha: isoEnMesActual(2), descripcion: 'P min2', monto: 1, foto: '', categoria: 'O', ministerioId: 2, ministerio: 'M2', estado: 'pendiente' }
      ],
      gastos: []
    });
    sync();

    expect(service.getConteoPendientes(1)).toEqual({ ingresos: 1, gastos: 0, total: 1 });
  });

  it('getUltimosMovimientos excluye pendientes y limita cantidad', () => {
    const base = isoEnMesActual(10);
    mocks.seed({
      ingresos: [
        { id: 1, fecha: base, descripcion: 'Reciente', monto: 50, foto: '', categoria: 'O', ministerio: 'G', estado: 'aprobado' },
        { id: 2, fecha: base, descripcion: 'No debe salir', monto: 1, foto: '', categoria: 'O', ministerio: 'G', estado: 'pendiente' }
      ],
      gastos: []
    });
    sync();

    const movs = service.getUltimosMovimientos(1);
    expect(movs.length).toBe(1);
    expect(movs[0].titulo).toBe('Reciente');
    expect(movs[0].tipo).toBe('ingreso');
  });

  it('getChartData devuelve 6 meses de series', () => {
    mocks.seed({
      ingresos: [
        { id: 1, fecha: isoEnMesActual(1), descripcion: 'I', monto: 10, foto: '', categoria: 'O', ministerio: 'G', estado: 'aprobado' }
      ],
      gastos: [
        { id: 1, fecha: isoEnMesActual(2), descripcion: 'G', monto: 5, foto: '', categoria: 'X', estado: 'aprobado' }
      ]
    });
    sync();

    const chart = service.getChartData();
    expect(chart.length).toBe(6);
    const mesActual = chart[chart.length - 1];
    expect(mesActual.ingresos).toBeGreaterThanOrEqual(10);
    expect(mesActual.gastos).toBeGreaterThanOrEqual(5);
  });

  it('notifyChanges incrementa dataRevision$', (done) => {
    let revision = 0;
    service.dataRevision$.subscribe(rev => { revision = rev; });
    sync();
    expect(revision).toBeGreaterThan(0);
    done();
  });
});
