import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import {
  DesgloseMinisterioReporte,
  DesgloseReporte,
  KardexLinea,
  Ministerio,
  Reporte
} from '../core/models';
import { DataService } from './data.service';
import { gastoAprobado } from '../shared/utils/gasto.util';
import { ingresoAprobado } from '../shared/utils/ingreso.util';
import { formatearISOaDDMMYYYY } from '../shared/utils/date.util';
import { periodoKeyFromFecha } from '../shared/utils/month.util';
import { etiquetaCuentaReporte } from '../shared/utils/reportes-cuenta.util';
import { resolverNombreMinisterio as resolverNombreMinisterioMovimiento } from '../shared/utils/movimiento-ministerio.util';
import { calcularMontoNetoMinisterio } from '../shared/utils/aportacion-iglesia.util';
import { Ingreso } from '../core/models';
import {
  estiloEncabezadoTabla,
  estiloFilaDatos,
  estiloMeta,
  estiloMoneda,
  estiloSeccion,
  estiloSubtitulo,
  estiloTituloPrincipal,
  estiloTotalLabel,
  estiloTotalValor,
  ExcelCellStyle
} from '../shared/utils/excel-ieca.styles';

export interface SaldoMinisterioExport {
  ministerioId: number;
  nombre: string;
  saldo: number;
}

export interface ExportarExcelOpciones {
  reportes: Reporte[];
  desglose: DesgloseReporte[];
  totales: { ingresos: number; gastos: number; saldo: number };
  saldosMinisterio: SaldoMinisterioExport[];
  kardex?: KardexLinea[];
  nombreMinisterioKardex?: string;
  etiquetaFiltro: string;
  nombreArchivo: string;
}

const COLS = 7;

@Injectable({ providedIn: 'root' })
export class ReportesService {

  constructor(private dataService: DataService) {}

  generarReportes(): Reporte[] {
    const ingresos    = this.dataService.getIngresosActuales().filter(ingresoAprobado);
    const gastos      = this.dataService.getGastosActuales().filter(gastoAprobado);
    const ministerios = this.dataService.getMinisteriosActuales();

    const reportes: Reporte[] = [];
    let idCounter = 1;

    ingresos.forEach(i => {
      const monto = this.montoIngresoReporte(i);
      reportes.push({
        id:              idCounter++,
        fecha:           i.fecha,
        fechaFormateada: formatearISOaDDMMYYYY(i.fecha),
        titulo:          i.descripcion,
        tipo:            i.cuentaNombre || i.categoria || 'Ingreso',
        cuentaCodigo:    i.cuentaCodigo,
        cuentaNombre:    i.cuentaNombre || i.categoria,
        ministerio:      resolverNombreMinisterioMovimiento(i.ministerioId, i.ministerio, ministerios, {
          esAportacionIglesia: i.esAportacionIglesia
        }),
        ministerioId:    i.ministerioId,
        ingresos:        monto,
        gastos:          0,
        saldo:           monto,
        archivo:         i.foto || '',
        mes:             periodoKeyFromFecha(i.fecha) ?? ''
      });
    });

    gastos.forEach(g => {
      reportes.push({
        id:              idCounter++,
        fecha:           g.fecha,
        fechaFormateada: formatearISOaDDMMYYYY(g.fecha),
        titulo:          g.descripcion,
        tipo:            g.cuentaNombre || g.categoria || 'Gasto',
        cuentaCodigo:    g.cuentaCodigo,
        cuentaNombre:    g.cuentaNombre || g.categoria,
        ministerio:      this.resolverNombreMinisterio(g.ministerioId, g.ministerio, ministerios),
        ministerioId:    g.ministerioId,
        ingresos:        0,
        gastos:          g.monto || 0,
        saldo:           -(g.monto || 0),
        archivo:         g.foto || '',
        mes:             periodoKeyFromFecha(g.fecha) ?? ''
      });
    });

    return reportes.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  resolverNombreMinisterio(
    ministerioId: number | undefined,
    ministerioGuardado: string | undefined,
    ministerios: Pick<Ministerio, 'id' | 'nombre'>[],
    opciones?: { esAportacionIglesia?: boolean }
  ): string {
    return resolverNombreMinisterioMovimiento(ministerioId, ministerioGuardado, ministerios, opciones);
  }

  /** Monto efectivo del ingreso en reportes (neto 67% para talento de ministerio). */
  private montoIngresoReporte(ingreso: Ingreso): number {
    if (ingreso.esAportacionIglesia) return ingreso.monto || 0;
    if (ingreso.ministerioId != null) return calcularMontoNetoMinisterio(ingreso);
    return ingreso.monto || 0;
  }

  calcularDesglosePorMinisterio(
    reportes: Reporte[],
    ministerios: Pick<Ministerio, 'id' | 'nombre'>[],
    ministerioScopeId?: number | null,
    opciones?: { mesPeriodo?: string | null; incluirAportacion?: boolean }
  ): DesgloseMinisterioReporte[] {
    const lista = ministerioScopeId != null
      ? ministerios.filter(m => Number(m.id) === Number(ministerioScopeId))
      : ministerios;

    const porId = new Map<number, { ingresos: number; gastos: number }>();
    lista.forEach(m => porId.set(m.id, { ingresos: 0, gastos: 0 }));

    reportes.forEach(r => {
      const id = r.ministerioId;
      if (id == null) return;
      const bucket = porId.get(id);
      if (!bucket) return;
      bucket.ingresos += r.ingresos || 0;
      bucket.gastos += r.gastos || 0;
    });

    const aportacionPeriodoMap = new Map<number, number>();
    const aportacionHistoricaMap = new Map<number, number>();
    if (opciones?.incluirAportacion) {
      this.dataService.getAportacionIglesiaPorMinisterio(opciones.mesPeriodo, ministerioScopeId)
        .forEach(row => aportacionPeriodoMap.set(row.ministerioId, row.aportacion));
      this.dataService.getAportacionIglesiaPorMinisterio(null, ministerioScopeId)
        .forEach(row => aportacionHistoricaMap.set(row.ministerioId, row.aportacion));
    }

    return lista
      .map(m => {
        const bucket = porId.get(m.id) ?? { ingresos: 0, gastos: 0 };
        return {
          ministerioId: m.id,
          nombre: m.nombre,
          ingresos: bucket.ingresos,
          gastos: bucket.gastos,
          saldo: bucket.ingresos - bucket.gastos,
          saldoDisponible: this.dataService.calcularSaldoMinisterio(m.id),
          aportacionPeriodo: aportacionPeriodoMap.get(m.id) ?? 0,
          aportacionHistorica: aportacionHistoricaMap.get(m.id) ?? 0
        };
      })
      .sort((a, b) => b.saldoDisponible - a.saldoDisponible);
  }

  calcularDesglose(reportes: Reporte[]): DesgloseReporte[] {
    const desgloseMap = new Map<string, DesgloseReporte>();

    reportes.forEach(r => {
      const categoria = etiquetaCuentaReporte(r);
      const existing = desgloseMap.get(categoria) || {
        categoria,
        ingresos: 0,
        gastos:   0,
        saldo:    0
      };
      existing.ingresos += r.ingresos || 0;
      existing.gastos   += r.gastos   || 0;
      existing.saldo     = existing.ingresos - existing.gastos;
      desgloseMap.set(categoria, existing);
    });

    return Array.from(desgloseMap.values()).sort((a, b) => b.ingresos - a.ingresos);
  }

  descargarExcel(opciones: ExportarExcelOpciones): void {
    const generado = new Date().toLocaleString('es-GT');
    const filas: (string | number)[][] = [];
    const merges: XLSX.Range[] = [];
    const estilosPorCelda = new Map<string, ExcelCellStyle>();

    const marcar = (r: number, c: number, estilo: ExcelCellStyle, colspan = 1) => {
      for (let i = 0; i < colspan; i++) {
        estilosPorCelda.set(XLSX.utils.encode_cell({ r, c: c + i }), estilo);
      }
      if (colspan > 1) {
        merges.push({ s: { r, c }, e: { r, c: c + colspan - 1 } });
      }
    };

    let r = 0;
    filas[r] = ['Iglesia del Evangelio Cuadrangular — La Alborada'];
    marcar(r, 0, estiloTituloPrincipal(), COLS);
    r++;

    filas[r] = ['Gestión Financiera · Reportes Financieros'];
    marcar(r, 0, estiloSubtitulo(), COLS);
    r++;

    filas[r] = [`Generado: ${generado}`];
    marcar(r, 0, estiloMeta(), COLS);
    r++;

    filas[r] = [`Exportación: ${opciones.etiquetaFiltro}`];
    marcar(r, 0, estiloMeta(), COLS);
    r++;

    filas[r] = [`Registros: ${opciones.reportes.length}`];
    marcar(r, 0, estiloMeta(), COLS);
    r++;

    filas[r] = [];
    r++;

    filas[r] = ['', 'Ingresos totales', 'Gastos totales', 'Saldo neto', '', '', ''];
    marcar(r, 1, estiloTotalLabel());
    marcar(r, 2, estiloTotalLabel());
    marcar(r, 3, estiloTotalLabel());
    r++;

    filas[r] = [
      '',
      opciones.totales.ingresos,
      opciones.totales.gastos,
      opciones.totales.saldo,
      '', '', ''
    ];
    marcar(r, 1, estiloTotalValor('ingreso'));
    marcar(r, 2, estiloTotalValor('gasto'));
    marcar(r, 3, estiloTotalValor('saldo'));
    r++;

    filas[r] = [];
    r++;

    if (opciones.saldosMinisterio.length > 0) {
      filas[r] = ['Saldo disponible por ministerio (acumulado)'];
      marcar(r, 0, estiloSeccion(), COLS);
      r++;

      filas[r] = ['Ministerio', 'Saldo disponible', '', '', '', '', ''];
      marcar(r, 0, estiloEncabezadoTabla());
      marcar(r, 1, estiloEncabezadoTabla());
      r++;

      opciones.saldosMinisterio.forEach((item, idx) => {
        filas[r] = [item.nombre, item.saldo, '', '', '', '', ''];
        const par = idx % 2 === 1;
        marcar(r, 0, estiloFilaDatos(par));
        marcar(r, 1, estiloMoneda(item.saldo < 0 ? 'red' : 'default', par));
        r++;
      });

      filas[r] = [];
      r++;
    }

    filas[r] = ['Detalle de movimientos'];
    marcar(r, 0, estiloSeccion(), COLS);
    r++;

    filas[r] = ['Fecha', 'Descripción', 'Cuenta', 'Ministerio', 'Ingresos', 'Gastos', 'Saldo'];
    for (let c = 0; c < COLS; c++) {
      marcar(r, c, estiloEncabezadoTabla());
    }
    r++;

    opciones.reportes.forEach((rep, idx) => {
      filas[r] = [
        rep.fechaFormateada || '',
        rep.titulo || '',
        etiquetaCuentaReporte(rep),
        rep.ministerio || '',
        rep.ingresos ?? 0,
        rep.gastos ?? 0,
        rep.saldo ?? 0
      ];
      const par = idx % 2 === 1;
      marcar(r, 0, estiloFilaDatos(par));
      marcar(r, 1, estiloFilaDatos(par));
      marcar(r, 2, estiloFilaDatos(par));
      marcar(r, 3, estiloFilaDatos(par));
      marcar(r, 4, estiloMoneda('green', par));
      marcar(r, 5, estiloMoneda('red', par));
      marcar(r, 6, estiloMoneda(rep.saldo < 0 ? 'red' : 'default', par));
      r++;
    });

    if (opciones.desglose.length > 0) {
      filas[r] = [];
      r++;

      filas[r] = ['Desglose por cuenta'];
      marcar(r, 0, estiloSeccion(), COLS);
      r++;

      filas[r] = ['Cuenta', 'Ingresos', 'Gastos', 'Saldo', '', '', ''];
      for (let c = 0; c < 4; c++) {
        marcar(r, c, estiloEncabezadoTabla());
      }
      r++;

      opciones.desglose.forEach((d, idx) => {
        filas[r] = [d.categoria, d.ingresos, d.gastos, d.saldo, '', '', ''];
        const par = idx % 2 === 1;
        marcar(r, 0, estiloFilaDatos(par));
        marcar(r, 1, estiloMoneda('green', par));
        marcar(r, 2, estiloMoneda('red', par));
        marcar(r, 3, estiloMoneda(d.saldo < 0 ? 'red' : 'default', par));
        r++;
      });
    }

    if (opciones.kardex && opciones.kardex.length > 0) {
      filas[r] = [];
      r++;

      const tituloKardex = opciones.nombreMinisterioKardex
        ? `Kardex de saldo — ${opciones.nombreMinisterioKardex}`
        : 'Kardex de saldo';
      filas[r] = [tituloKardex];
      marcar(r, 0, estiloSeccion(), COLS);
      r++;

      filas[r] = ['Fecha', 'Descripción', 'Cuenta', 'Tipo', 'Ingreso', 'Gasto', 'Saldo'];
      for (let c = 0; c < COLS; c++) {
        marcar(r, c, estiloEncabezadoTabla());
      }
      r++;

      [...opciones.kardex].reverse().forEach((linea, idx) => {
        filas[r] = [
          linea.fechaFormateada,
          linea.descripcion,
          linea.cuentaEtiqueta,
          linea.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
          linea.ingreso > 0 ? linea.ingreso : '',
          linea.gasto > 0 ? linea.gasto : '',
          linea.saldo
        ];
        const par = idx % 2 === 1;
        marcar(r, 0, estiloFilaDatos(par));
        marcar(r, 1, estiloFilaDatos(par));
        marcar(r, 2, estiloFilaDatos(par));
        marcar(r, 3, estiloFilaDatos(par));
        marcar(r, 4, estiloMoneda('green', par));
        marcar(r, 5, estiloMoneda('red', par));
        marcar(r, 6, estiloMoneda(linea.saldo < 0 ? 'red' : 'default', par));
        r++;
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws['!merges'] = merges;
    ws['!cols'] = [
      { wch: 12 }, { wch: 38 }, { wch: 14 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }
    ];
    ws['!rows'] = [
      { hpt: 32 }, { hpt: 22 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 },
      { hpt: 10 }, { hpt: 20 }, { hpt: 24 }, { hpt: 10 },
      { hpt: 22 }, { hpt: 24 }
    ];

    estilosPorCelda.forEach((estilo, addr) => {
      if (ws[addr]) {
        ws[addr].s = estilo;
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

    const nombre = opciones.nombreArchivo.endsWith('.xlsx')
      ? opciones.nombreArchivo
      : `${opciones.nombreArchivo}.xlsx`;
    XLSX.writeFile(wb, nombre);
  }

  calcularTotales(reportes: Reporte[]): { ingresos: number; gastos: number; saldo: number } {
    const ingresos = reportes.reduce((sum, r) => sum + (r.ingresos || 0), 0);
    const gastos   = reportes.reduce((sum, r) => sum + (r.gastos || 0), 0);
    return { ingresos, gastos, saldo: ingresos - gastos };
  }

  construirSaldosMinisterio(
    ministerios: Pick<Ministerio, 'id' | 'nombre'>[],
    ministerioScopeId?: number | null
  ): SaldoMinisterioExport[] {
    const lista = ministerioScopeId != null
      ? ministerios.filter(m => Number(m.id) === Number(ministerioScopeId))
      : ministerios;

    return lista
      .map(m => ({
        ministerioId: m.id,
        nombre: m.nombre,
        saldo: this.dataService.calcularSaldoMinisterio(m.id)
      }))
      .sort((a, b) => b.saldo - a.saldo);
  }
}
