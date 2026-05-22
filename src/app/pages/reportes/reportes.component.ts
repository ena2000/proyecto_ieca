import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonButton, IonSearchbar, ToastController, IonLabel, IonItem,
  IonSelect, IonSelectOption, IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, expandOutline, closeOutline, downloadOutline
} from 'ionicons/icons';

import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { DataService } from '../../services/data.service';

registerLocaleData(localeEs);

interface Ministerio {
  id: number;
  nombre: string;
}

interface Desglose {
  categoria: string;
  ingresos: number;
  gastos: number;
  saldo: number;
}

interface Reporte {
  id: number;
  fecha: string;
  titulo: string;
  tipo: string;
  ingresos: number;
  gastos: number;
  saldo: number;
  archivo: string;
  ministerio?: string;
  ministerioId?: number;
  mes?: string;
  desglose?: Desglose[];
  fechaFormateada?: string;
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonSearchbar,
    IonLabel,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    TablaGeneralComponent
  ],
  providers: [ToastController]
})
export class ReportesComponent implements OnInit, OnDestroy {

  listaReportes: Reporte[] = [];
  listaMinisterios: Ministerio[] = [];
  searchTerm: string = '';
  filtroMes: string = '';
  filtroMinisterioId: number | null = null;
  fotoSeleccionada: string | null = null;

  columnsReportes: TableColumn[] = [
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'titulo',          header: 'Descripción' },
    { field: 'tipo',            header: 'Tipo',      type: 'badge' },
    { field: 'ministerio',      header: 'Ministerio' },
    { field: 'ingresos',        header: 'Ingresos',  type: 'currency' },
    { field: 'gastos',          header: 'Gastos',    type: 'currency' },
    { field: 'saldo',           header: 'Saldo',     type: 'currency' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private toastController: ToastController,
    private dataService: DataService
  ) {
    addIcons({
      'notifications-outline': notificationsOutline,
      'expand-outline':        expandOutline,
      'close-outline':         closeOutline,
      'download-outline':      downloadOutline
    });
  }

  ngOnInit() {
    this.cargarMinisterios();
    this.generarReportes();

    // Refrescar cada 3 segundos para reflejar nuevos ingresos/gastos
    interval(3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dataService.refreshAllData();
        this.generarReportes();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', [])
  handleEscapeKey() {
    if (this.fotoSeleccionada) this.cerrarImagen();
  }

  verImagen(foto: any) {
    if (foto && typeof foto === 'string') {
      this.fotoSeleccionada = foto;
      document.body.style.overflow = 'hidden';
    }
  }

  cerrarImagen() {
    this.fotoSeleccionada = null;
    document.body.style.overflow = 'auto';
  }

  // ✅ Genera reportes dinámicamente desde ingresos y gastos reales
  // Ya no lee de 'reportes' en localStorage — esa clave nunca se llenaba
  private generarReportes() {
    const ingresos = this.dataService.getIngresosActuales();
    const gastos   = this.dataService.getGastosActuales();

    const reportes: Reporte[] = [];
    let idCounter = 1;

    // --- Agregar cada ingreso como fila de reporte ---
    ingresos.forEach(i => {
      reportes.push({
        id:              idCounter++,
        fecha:           i.fecha,
        fechaFormateada: this.formatearISOaDDMMYYYY(i.fecha),
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

    // --- Agregar cada gasto como fila de reporte ---
    gastos.forEach(g => {
      reportes.push({
        id:              idCounter++,
        fecha:           g.fecha,
        fechaFormateada: this.formatearISOaDDMMYYYY(g.fecha),
        titulo:          g.descripcion,
        tipo:            g.categoria || 'Gasto',
        ministerio:      g.proveedor || 'General',
        ministerioId:    g.ministerioId,
        ingresos:        0,
        gastos:          g.monto || 0,
        saldo:           -(g.monto || 0),
        archivo:         g.foto || '',
        mes:             new Date(g.fecha).toISOString().substring(0, 7)
      });
    });

    // Ordenar por fecha descendente
    this.listaReportes = reportes.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  // --- Filtros ---
  get listaFiltrada(): Reporte[] {
    let filtrados = [...this.listaReportes];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(r =>
        r.titulo?.toLowerCase().includes(search) ||
        r.tipo?.toLowerCase().includes(search) ||
        r.ministerio?.toLowerCase().includes(search)
      );
    }

    if (this.filtroMes) {
      filtrados = filtrados.filter(r => r.mes === this.filtroMes);
    }

    if (this.filtroMinisterioId !== null) {
      filtrados = filtrados.filter(r => r.ministerioId === this.filtroMinisterioId);
    }

    return filtrados;
  }

  // --- Totales calculados sobre la lista filtrada ---
  get totalIngresosFiltrado(): number {
    return this.listaFiltrada.reduce((sum, r) => sum + (r.ingresos || 0), 0);
  }

  get totalGastosFiltrado(): number {
    return this.listaFiltrada.reduce((sum, r) => sum + (r.gastos || 0), 0);
  }

  get totalSaldoFiltrado(): number {
    return this.totalIngresosFiltrado - this.totalGastosFiltrado;
  }

  // --- Desglose agrupado por tipo/categoría ---
  get desgloseAgregado(): Desglose[] {
    const desgloseMap = new Map<string, Desglose>();

    this.listaFiltrada.forEach(r => {
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

    return Array.from(desgloseMap.values())
      .sort((a, b) => b.ingresos - a.ingresos);
  }

  // --- Exportar PDF real usando la API de impresión del navegador ---
  descargarReporte(item: Reporte) {
    this.mostrarToast(`Preparando reporte: ${item.titulo}`, 'success');
    setTimeout(() => window.print(), 500);
  }

  // --- Exportar todo el resumen como CSV ---
  exportarCSV() {
    const encabezado = 'Fecha,Descripción,Tipo,Ministerio,Ingresos,Gastos,Saldo\n';
    const filas = this.listaFiltrada.map(r =>
      `${r.fechaFormateada},"${r.titulo}",${r.tipo},${r.ministerio || ''},${r.ingresos},${r.gastos},${r.saldo}`
    ).join('\n');

    const blob = new Blob([encabezado + filas], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `reporte_${this.filtroMes || 'completo'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.mostrarToast('Reporte CSV descargado exitosamente', 'success');
  }

  cargarMinisterios() {
    const data = localStorage.getItem('ministerios');
    if (data) {
      try {
        const ministerios = JSON.parse(data);
        this.listaMinisterios = ministerios.map((m: any, idx: number) => ({
          id:     m.id || idx,
          nombre: m.nombre
        }));
      } catch (e) {
        this.listaMinisterios = [];
      }
    }
  }

  private formatearISOaDDMMYYYY(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const dd   = String(date.getDate()).padStart(2, '0');
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message:  mensaje,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}