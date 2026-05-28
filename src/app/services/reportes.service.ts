import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { DesgloseReporte, Ministerio, Reporte } from '../core/models';
import { DataService } from './data.service';
import { gastoAprobado } from '../shared/utils/gasto.util';
import { ingresoAprobado } from '../shared/utils/ingreso.util';
import { formatearISOaDDMMYYYY } from '../shared/utils/date.util';
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

export interface ExportarExcelOpciones {
  reportes: Reporte[];
  desglose: DesgloseReporte[];
  totales: { ingresos: number; gastos: number; saldo: number };
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
      reportes.push({
        id:              idCounter++,
        fecha:           i.fecha,
        fechaFormateada: formatearISOaDDMMYYYY(i.fecha),
        titulo:          i.descripcion,
        tipo:            i.tipo || 'Ingreso',
        ministerio:      i.ministerio || 'General',
        ministerioId:    i.ministerioId,
        ingresos:        i.monto || 0,
        gastos:          0,
        saldo:           i.monto || 0,
        archivo:         i.foto || '',
        mes:             new Date(i.fecha).toISOString().substring(0, 7)
      });
    });

    gastos.forEach(g => {
      reportes.push({
        id:              idCounter++,
        fecha:           g.fecha,
        fechaFormateada: formatearISOaDDMMYYYY(g.fecha),
        titulo:          g.descripcion,
        tipo:            g.categoria || 'Gasto',
        ministerio:      this.resolverNombreMinisterio(g.ministerioId, g.ministerio, ministerios),
        ministerioId:    g.ministerioId,
        ingresos:        0,
        gastos:          g.monto || 0,
        saldo:           -(g.monto || 0),
        archivo:         g.foto || '',
        mes:             new Date(g.fecha).toISOString().substring(0, 7)
      });
    });

    return reportes.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  resolverNombreMinisterio(
    ministerioId: number | undefined,
    ministerioGuardado: string | undefined,
    ministerios: Pick<Ministerio, 'id' | 'nombre'>[]
  ): string {
    if (ministerioGuardado) return ministerioGuardado;
    if (ministerioId != null) {
      const m = ministerios.find(x => x.id === ministerioId);
      if (m) return m.nombre;
    }
    return 'General';
  }

  calcularDesglose(reportes: Reporte[]): DesgloseReporte[] {
    const desgloseMap = new Map<string, DesgloseReporte>();

    reportes.forEach(r => {
      const categoria = r.tipo || 'Sin categoría';
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

    filas[r] = ['Detalle de movimientos'];
    marcar(r, 0, estiloSeccion(), COLS);
    r++;

    filas[r] = ['Fecha', 'Descripción', 'Tipo', 'Ministerio', 'Ingresos', 'Gastos', 'Saldo'];
    for (let c = 0; c < COLS; c++) {
      marcar(r, c, estiloEncabezadoTabla());
    }
    r++;

    opciones.reportes.forEach((rep, idx) => {
      filas[r] = [
        rep.fechaFormateada || '',
        rep.titulo || '',
        rep.tipo || '',
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

      filas[r] = ['Desglose por categoría'];
      marcar(r, 0, estiloSeccion(), COLS);
      r++;

      filas[r] = ['Categoría', 'Ingresos', 'Gastos', 'Saldo', '', '', ''];
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
}
