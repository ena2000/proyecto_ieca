import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, merge } from 'rxjs';

import {

  Ingreso, Gasto, Ministerio, Usuario, Movimiento, KPIs, MesData

} from '../core/models';

import { IngresosService } from './ingresos.service';
import { GastosService } from './gastos.service';
import { MinisteriosService } from './ministerios.service';
import { UsuariosService } from './usuarios.service';
import { gastoAprobado } from '../shared/utils/gasto.util';
import { ingresoAprobado } from '../shared/utils/ingreso.util';

export type {

  Ingreso, Gasto, Ministerio, Usuario, Movimiento, KPIs, MesData

} from '../core/models';



@Injectable({

  providedIn: 'root'

})

export class DataService {



  private ingresosSubject = new BehaviorSubject<Ingreso[]>([]);

  private gastosSubject = new BehaviorSubject<Gasto[]>([]);

  private ministeriosSubject = new BehaviorSubject<Ministerio[]>([]);

  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);



  ingresos$ = this.ingresosSubject.asObservable();

  gastos$ = this.gastosSubject.asObservable();

  ministerios$ = this.ministeriosSubject.asObservable();

  usuarios$ = this.usuariosSubject.asObservable();



  constructor(
    private ingresosService: IngresosService,
    private gastosService: GastosService,
    private ministeriosService: MinisteriosService,
    private usuariosService: UsuariosService
  ) {
    merge(
      this.ingresosService.ingresos$,
      this.gastosService.gastos$,
      this.ministeriosService.ministerios$,
      this.usuariosService.usuarios$
    ).subscribe(() => this.syncFromEntityServices());

    this.syncFromEntityServices();
  }

  /** Fuerza sincronización del cache global (dashboard, reportes, admin). */
  notifyChanges(): void {
    this.syncFromEntityServices();
  }

  refreshAllData() {
    this.ingresosService.reload();
    this.gastosService.reload();
    this.ministeriosService.reload();
    this.usuariosService.reload();
    this.syncFromEntityServices();
  }

  private syncFromEntityServices(): void {
    this.ingresosSubject.next([...this.ingresosService.getAll()]);
    this.gastosSubject.next([...this.gastosService.getAll()]);
    this.ministeriosSubject.next([...this.ministeriosService.getAll()]);
    this.usuariosSubject.next([...this.usuariosService.getAll()]);
  }



  getIngresos(): Observable<Ingreso[]> {

    return this.ingresos$;

  }



  getGastos(): Observable<Gasto[]> {

    return this.gastos$;

  }



  getMinisterios(): Observable<Ministerio[]> {

    return this.ministerios$;

  }



  getUsuarios(): Observable<Usuario[]> {

    return this.usuarios$;

  }



  getIngresosActuales(): Ingreso[] {

    return this.ingresosSubject.getValue();

  }



  getGastosActuales(): Gasto[] {

    return this.gastosSubject.getValue();

  }



  getMinisteriosActuales(): Ministerio[] {

    return this.ministeriosSubject.getValue();

  }



  getUsuariosActuales(): Usuario[] {

    return this.usuariosSubject.getValue();

  }

  /** Solo movimientos aprobados cuentan en balance, gráficos y reportes consolidados. */
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



    const totalIngresos = ingresosDelMes.reduce((sum, i) => sum + (i.monto || 0), 0);

    const totalGastos = gastosDelMes.reduce((sum, g) => sum + (g.monto || 0), 0);

    const balance = totalIngresos - totalGastos;



    const ministeriosActivos = ministerioId != null
      ? (ministerios.some(m => m.id === ministerioId && m.estado === 'Activo') ? 1 : 0)
      : ministerios.filter(m => m.estado === 'Activo').length;



    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);

    const mesAnteriorNum = mesAnterior.getMonth();

    const anioAnterior = mesAnterior.getFullYear();



    const ingresosAnterior = ingresos.filter(i => {

      const fecha = new Date(i.fecha);

      return fecha.getMonth() === mesAnteriorNum && fecha.getFullYear() === anioAnterior;

    }).reduce((sum, i) => sum + (i.monto || 0), 0);



    const gastosAnterior = gastos.filter(g => {

      const fecha = new Date(g.fecha);

      return fecha.getMonth() === mesAnteriorNum && fecha.getFullYear() === anioAnterior;

    }).reduce((sum, g) => sum + (g.monto || 0), 0);



    const tendenciaIngresos = ingresosAnterior > 0

      ? ((totalIngresos - ingresosAnterior) / ingresosAnterior * 100).toFixed(0) + '%'

      : '0%';



    const tendenciaGastos = gastosAnterior > 0

      ? ((totalGastos - gastosAnterior) / gastosAnterior * 100).toFixed(0) + '%'

      : '0%';



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
        ministerio: i.ministerio || 'General',
        monto: i.monto || 0,
        fecha: this.formatearFecha(i.fecha),
        fechaOrden: new Date(i.fecha).getTime()
      })),
      ...gastos.map(g => ({
        tipo: 'gasto' as const,
        titulo: g.descripcion,
        ministerio: g.ministerio || ministerios.find(m => m.id === g.ministerioId)?.nombre || 'General',
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

    const meses = ['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'];

    const ahora = new Date();

    const chartData: MesData[] = [];



    for (let i = 5; i >= 0; i--) {

      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);

      const mes = fecha.getMonth();

      const anio = fecha.getFullYear();



      const ingresosDelMes = ingresos.filter(ing => {

        const f = new Date(ing.fecha);

        return f.getMonth() === mes && f.getFullYear() === anio;

      }).reduce((sum, ing) => sum + (ing.monto || 0), 0);



      const gastosDelMes = gastos.filter(g => {

        const f = new Date(g.fecha);

        return f.getMonth() === mes && f.getFullYear() === anio;

      }).reduce((sum, g) => sum + (g.monto || 0), 0);



      chartData.push({

        mes: meses[fecha.getMonth()],

        ingresos: ingresosDelMes,

        gastos: gastosDelMes

      });

    }



    return chartData;

  }



  getDistribucionMinisterios(ministerioId?: number): Array<{ nombre: string; color: string; porcentaje: number }> {

    const ingresos = this.filterPorMinisterio(this.getIngresosActuales(), ministerioId);

    const ministerios = ministerioId != null
      ? this.getMinisteriosActuales().filter(m => m.id === ministerioId)
      : this.getMinisteriosActuales();



    const coloresDefault = ['#1e3a8a', '#7c3aed', '#0891b2', '#059669', '#dc2626', '#ea580c'];

    const distribucion = new Map<string, number>();



    ministerios.forEach(m => {

      distribucion.set(m.nombre, 0);

    });



    if (!distribucion.has('General')) {

      distribucion.set('General', 0);

    }



    ingresos.forEach(i => {

      const min = i.ministerio || 'General';

      distribucion.set(min, (distribucion.get(min) || 0) + (i.monto || 0));

    });



    const total = Array.from(distribucion.values()).reduce((a, b) => a + b, 0);

    return Array.from(distribucion.entries())

      .map((entry, idx) => ({

        nombre: entry[0],

        color: coloresDefault[idx % coloresDefault.length],

        porcentaje: total > 0 ? Math.round((entry[1] / total) * 100) : 0

      }))

      .sort((a, b) => b.porcentaje - a.porcentaje);

  }

  private formatearFecha(fecha: string): string {

    const hoy = new Date();

    const ayer = new Date(hoy);

    ayer.setDate(ayer.getDate() - 1);



    const fecha_obj = new Date(fecha);



    if (fecha_obj.toDateString() === hoy.toDateString()) {

      return 'Hoy';

    } else if (fecha_obj.toDateString() === ayer.toDateString()) {

      return 'Ayer';

    } else {

      return fecha_obj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

    }

  }

}


