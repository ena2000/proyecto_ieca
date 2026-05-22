import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Ingreso {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  tipo: string;
  ministerio: string;
  ministerioId?: number;
  usuarioId?: number;
  registradoPor?: string;
  fechaFormateada?: string;
}

export interface Gasto {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number | null;
  foto: string;
  categoria: string;
  proveedor: string;
  ministerioId?: number;
  usuarioId?: number;
  registradoPor?: string;
  fechaFormateada?: string;
}

export interface Ministerio {
  id: number;
  fecha?: string;
  nombre: string;
  estado: string;
  hldrId?: number;
  coLiderId?: number;
  fechaFormateada?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
  estado?: string;
  ministerioId?: number;
  fechaFormateada?: string;
}

export interface Movimiento {
  tipo: 'ingreso' | 'gasto';
  titulo: string;
  ministerio: string;
  monto: number;
  fecha: string;
}

export interface KPIs {
  balance: number;
  ingresos: number;
  gastosMes: number;
  ministeriosActivos: number;
  tendenciaIngresos: string;
  tendenciaGastos: string;
  superavit: number;
  transacciones: number;
}

export interface MesData {
  mes: string;
  ingresos: number;
  gastos: number;
}

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

  constructor() {
    this.cargarTodos();
  }

  // Cargar todos los datos desde localStorage
  private cargarTodos() {
    this.cargarIngresos();
    this.cargarGastos();
    this.cargarMinisterios();
    this.cargarUsuarios();
  }

  // Cargar ingresos
  private cargarIngresos() {
    const data = localStorage.getItem('ingresos');
    if (data) {
      try {
        this.ingresosSubject.next(JSON.parse(data));
      } catch (e) {
        this.ingresosSubject.next([]);
      }
    }
  }

  // Cargar gastos
  private cargarGastos() {
    const data = localStorage.getItem('gastos');
    if (data) {
      try {
        this.gastosSubject.next(JSON.parse(data));
      } catch (e) {
        this.gastosSubject.next([]);
      }
    }
  }

  // Cargar ministerios
  private cargarMinisterios() {
    const data = localStorage.getItem('ministerios');
    if (data) {
      try {
        this.ministeriosSubject.next(JSON.parse(data));
      } catch (e) {
        this.ministeriosSubject.next([]);
      }
    }
  }

  // Cargar usuarios
  private cargarUsuarios() {
    const data = localStorage.getItem('usuarios');
    if (data) {
      try {
        this.usuariosSubject.next(JSON.parse(data));
      } catch (e) {
        this.usuariosSubject.next([]);
      }
    }
  }

  // Refresh de todos los datos
  refreshAllData() {
    this.cargarTodos();
  }

  // Obtener ingresos como observable
  getIngresos(): Observable<Ingreso[]> {
    return this.ingresos$;
  }

  // Obtener gastos como observable
  getGastos(): Observable<Gasto[]> {
    return this.gastos$;
  }

  // Obtener ministerios como observable
  getMinisterios(): Observable<Ministerio[]> {
    return this.ministerios$;
  }

  // Obtener usuarios como observable
  getUsuarios(): Observable<Usuario[]> {
    return this.usuarios$;
  }

  // Obtener el valor actual de ingresos sin observable
  getIngresosActuales(): Ingreso[] {
    return this.ingresosSubject.getValue();
  }

  // Obtener el valor actual de gastos sin observable
  getGastosActuales(): Gasto[] {
    return this.gastosSubject.getValue();
  }

  // Obtener el valor actual de ministerios sin observable
  getMinisteriosActuales(): Ministerio[] {
    return this.ministeriosSubject.getValue();
  }

  // Obtener el valor actual de usuarios sin observable
  getUsuariosActuales(): Usuario[] {
    return this.usuariosSubject.getValue();
  }

  // Calcular KPIs del dashboard
  calcularKPIs(): KPIs {
    const ingresos = this.getIngresosActuales();
    const gastos = this.getGastosActuales();
    const ministerios = this.getMinisteriosActuales();

    // Total de ingresos del mes
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

    // Ministerios activos
    const ministeriosActivos = ministerios.filter(m => m.estado === 'Activo').length;

    // Tendencias (comparación mes anterior)
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
      balance: balance,
      ingresos: totalIngresos,
      gastosMes: totalGastos,
      ministeriosActivos: ministeriosActivos || 0,
      tendenciaIngresos: tendenciaIngresos,
      tendenciaGastos: tendenciaGastos,
      superavit: balance,
      transacciones: ingresosDelMes.length + gastosDelMes.length
    };
  }

  // Obtener últimos movimientos combinados
  getUltimosMovimientos(cantidad: number = 5): Movimiento[] {
    const ingresos = this.getIngresosActuales();
    const gastos = this.getGastosActuales();

    const movimientos: Movimiento[] = [];

    // Agregar ingresos
    ingresos.forEach(i => {
      movimientos.push({
        tipo: 'ingreso',
        titulo: i.descripcion,
        ministerio: i.ministerio || 'General',
        monto: i.monto || 0,
        fecha: this.formatearFecha(i.fecha)
      });
    });

    // Agregar gastos
    gastos.forEach(g => {
      movimientos.push({
        tipo: 'gasto',
        titulo: g.descripcion,
        ministerio: g.proveedor || 'General',
        monto: g.monto || 0,
        fecha: this.formatearFecha(g.fecha)
      });
    });

    // Ordenar por fecha descendente y tomar los últimos N
    return movimientos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, cantidad);
  }

  // Obtener datos de gráfico de últimos 6 meses
  getChartData(): MesData[] {
    const ingresos = this.getIngresosActuales();
    const gastos = this.getGastosActuales();

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

  // Obtener distribución por ministerio
  getDistribucionMinisterios(): Array<{ nombre: string; color: string; porcentaje: number }> {
    const ingresos = this.getIngresosActuales();
    const ministerios = this.getMinisteriosActuales();

    const coloresDefault = ['#1e3a8a', '#7c3aed', '#0891b2', '#059669', '#dc2626', '#ea580c'];
    const distribucion = new Map<string, number>();

    // Inicializar todos los ministerios con 0
    ministerios.forEach(m => {
      distribucion.set(m.nombre, 0);
    });

    // Agregar "General" si no está
    if (!distribucion.has('General')) {
      distribucion.set('General', 0);
    }

    // Contar ingresos por ministerio
    ingresos.forEach(i => {
      const min = i.ministerio || 'General';
      distribucion.set(min, (distribucion.get(min) || 0) + (i.monto || 0));
    });

    // Calcular porcentajes
    const total = Array.from(distribucion.values()).reduce((a, b) => a + b, 0);
    const resultado = Array.from(distribucion.entries())
      .map((entry, idx) => ({
        nombre: entry[0],
        color: coloresDefault[idx % coloresDefault.length],
        porcentaje: total > 0 ? Math.round((entry[1] / total) * 100) : 0
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    return resultado;
  }

  // Utilidad para formatear fechas
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
