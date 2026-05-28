import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonButton, IonSearchbar, ToastController, IonLabel, IonItem,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, expandOutline, closeOutline, downloadOutline,
  calendarOutline, chevronBackOutline, chevronForwardOutline, funnelOutline,
  businessOutline, cashOutline, trendingDownOutline
} from 'ionicons/icons';

export type FiltroMovimientoReporte = 'todos' | 'ingresos' | 'gastos';

import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { DesgloseReporte, Ministerio, Reporte } from '../../core/models';
import { DataService } from '../../services/data.service';
import { ReportesService } from '../../services/reportes.service';
import { AuthService } from '../../core/services/auth.service';
import { etiquetaParaMes, padMes } from '../../shared/utils/month.util';

registerLocaleData(localeEs);

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
    TablaGeneralComponent,
    NotificacionesBellComponent
  ],
  providers: [ToastController]
})
export class ReportesComponent implements OnInit, OnDestroy {

  listaReportes: Reporte[] = [];
  listaMinisterios: Pick<Ministerio, 'id' | 'nombre'>[] = [];
  searchTerm = '';
  filtroMes = '';
  filtroMinisterioId: number | null = null;
  filtroMovimiento: FiltroMovimientoReporte = 'todos';
  fotoSeleccionada: string | null = null;
  periodoPreset: 'todos' | 'este_mes' | 'anterior' | 'custom' = 'este_mes';
  ministerioScopeId: number | null = null;
  filtroMinisterioBloqueado = false;

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
    private dataService: DataService,
    private reportesService: ReportesService,
    private authService: AuthService
  ) {
    addIcons({
      'notifications-outline': notificationsOutline,
      'expand-outline':        expandOutline,
      'close-outline':         closeOutline,
      'download-outline':      downloadOutline,
      'calendar-outline':      calendarOutline,
      'chevron-back-outline':  chevronBackOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'funnel-outline':        funnelOutline,
      'business-outline':        businessOutline,
      'cash-outline':            cashOutline,
      'trending-down-outline':   trendingDownOutline
    });
  }

  esRegistroIngreso(r: Reporte): boolean {
    return (r.ingresos || 0) > 0 && (r.gastos || 0) === 0;
  }

  esRegistroGasto(r: Reporte): boolean {
    return (r.gastos || 0) > 0 && (r.ingresos || 0) === 0;
  }

  setFiltroMovimiento(tipo: FiltroMovimientoReporte): void {
    this.filtroMovimiento = tipo;
  }

  ngOnInit() {
    this.ministerioScopeId = this.authService.getMinisterioScopeId();
    if (this.ministerioScopeId != null) {
      this.filtroMinisterioId = this.ministerioScopeId;
      this.filtroMinisterioBloqueado = true;
    }

    this.actualizarDatos();
    this.setPeriodo('este_mes');

    combineLatest([this.dataService.ingresos$, this.dataService.gastos$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarDatos());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private actualizarDatos() {
    this.listaMinisterios = this.dataService.getMinisteriosActuales().map(m => ({
      id: m.id,
      nombre: m.nombre
    }));
    this.listaReportes = this.reportesService.generarReportes();
  }

  @HostListener('document:keydown.escape', [])
  handleEscapeKey() {
    if (this.fotoSeleccionada) this.cerrarImagen();
  }

  verImagen(foto: unknown) {
    if (foto && typeof foto === 'string') {
      this.fotoSeleccionada = foto;
      document.body.style.overflow = 'hidden';
    }
  }

  cerrarImagen() {
    this.fotoSeleccionada = null;
    document.body.style.overflow = 'auto';
  }

  get etiquetaMesActivo(): string {
    if (!this.filtroMes) return 'Todo el historial';
    return etiquetaParaMes(this.filtroMes);
  }

  get mesesDisponibles(): { value: string; label: string }[] {
    const meses = new Set<string>();
    this.listaReportes.forEach(r => {
      if (r.mes) meses.add(r.mes);
    });
    meses.add(padMes(new Date()));
    return Array.from(meses)
      .sort((a, b) => b.localeCompare(a))
      .map(value => ({ value, label: etiquetaParaMes(value) }));
  }

  get puedeAvanzarMes(): boolean {
    if (!this.filtroMes) return false;
    return this.filtroMes < padMes(new Date());
  }

  get hayFiltrosActivos(): boolean {
    return this.hayFiltrosActivosExportacion;
  }

  /** Filtros que el usuario aplicó (no cuenta el ministerio fijo del líder). */
  get hayFiltrosActivosExportacion(): boolean {
    if (this.searchTerm.trim()) return true;
    if (this.filtroMes) return true;
    if (this.filtroMovimiento !== 'todos') return true;
    if (this.ministerioScopeId == null && this.filtroMinisterioId !== null) return true;
    return false;
  }

  setPeriodo(preset: 'todos' | 'este_mes' | 'anterior' | 'custom'): void {
    this.periodoPreset = preset;
    const hoy = new Date();

    if (preset === 'todos') {
      this.filtroMes = '';
      return;
    }
    if (preset === 'este_mes') {
      this.filtroMes = padMes(hoy);
      return;
    }
    if (preset === 'anterior') {
      this.filtroMes = padMes(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
    }
  }

  onMesCambio(): void {
    this.periodoPreset = 'custom';
  }

  mesAnterior(): void {
    const base = this.filtroMes || padMes(new Date());
    const [anio, mes] = base.split('-').map(Number);
    this.filtroMes = padMes(new Date(anio, mes - 2, 1));
    this.periodoPreset = 'custom';
  }

  mesSiguiente(): void {
    if (!this.puedeAvanzarMes) return;
    const [anio, mes] = this.filtroMes.split('-').map(Number);
    this.filtroMes = padMes(new Date(anio, mes, 1));
    this.periodoPreset = 'custom';
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroMovimiento = 'todos';
    if (!this.filtroMinisterioBloqueado) {
      this.filtroMinisterioId = null;
    }
    this.setPeriodo('todos');
  }

  get listaFiltrada(): Reporte[] {
    let filtrados = [...this.listaReportes];

    if (this.ministerioScopeId != null) {
      filtrados = filtrados.filter(r => Number(r.ministerioId) === this.ministerioScopeId);
    }

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

    if (this.filtroMovimiento === 'ingresos') {
      filtrados = filtrados.filter(r => this.esRegistroIngreso(r));
    } else if (this.filtroMovimiento === 'gastos') {
      filtrados = filtrados.filter(r => this.esRegistroGasto(r));
    }

    return filtrados;
  }

  get etiquetaFiltroMovimiento(): string {
    if (this.filtroMovimiento === 'ingresos') return 'Solo ingresos';
    if (this.filtroMovimiento === 'gastos') return 'Solo gastos';
    return 'Ingresos y gastos';
  }

  get totalIngresosFiltrado(): number {
    return this.listaFiltrada.reduce((sum, r) => sum + (r.ingresos || 0), 0);
  }

  get totalGastosFiltrado(): number {
    return this.listaFiltrada.reduce((sum, r) => sum + (r.gastos || 0), 0);
  }

  get totalSaldoFiltrado(): number {
    return this.totalIngresosFiltrado - this.totalGastosFiltrado;
  }

  get desgloseAgregado(): DesgloseReporte[] {
    return this.reportesService.calcularDesglose(this.listaFiltrada);
  }

  descargarReporte(item: Reporte) {
    this.mostrarToast(`Preparando reporte: ${item.titulo}`, 'success');
    setTimeout(() => window.print(), 500);
  }

  exportarExcel(): void {
    const conFiltros = this.hayFiltrosActivosExportacion;
    const reportes   = conFiltros ? this.listaFiltrada : this.listaParaExportarTodo;

    if (reportes.length === 0) {
      this.mostrarToast('No hay registros para exportar.', 'warning');
      return;
    }

    const desglose = this.reportesService.calcularDesglose(reportes);
    const totales  = this.reportesService.calcularTotales(reportes);
    const fecha    = new Date().toISOString().slice(0, 10);
    const sufijo   =
      this.filtroMovimiento === 'ingresos' ? '_ingresos' :
      this.filtroMovimiento === 'gastos' ? '_gastos' : '';

    this.reportesService.descargarExcel({
      reportes,
      desglose,
      totales,
      etiquetaFiltro: conFiltros
        ? this.construirEtiquetaFiltro()
        : 'Tabla completa (sin filtros aplicados)',
      nombreArchivo: `reportes_ieca${sufijo}_${fecha}.xlsx`
    });

    this.mostrarToast(
      `Excel descargado (${reportes.length} registro${reportes.length === 1 ? '' : 's'}).`,
      'success'
    );
  }

  private get listaParaExportarTodo(): Reporte[] {
    if (this.ministerioScopeId != null) {
      return this.listaReportes.filter(
        r => Number(r.ministerioId) === this.ministerioScopeId
      );
    }
    return [...this.listaReportes];
  }

  private construirEtiquetaFiltro(): string {
    const partes: string[] = [];
    partes.push(this.filtroMes ? `Período: ${this.etiquetaMesActivo}` : 'Período: todo el historial');

    if (this.filtroMinisterioId !== null) {
      const min = this.listaMinisterios.find(m => m.id === this.filtroMinisterioId);
      partes.push(`Ministerio: ${min?.nombre || this.filtroMinisterioId}`);
    } else if (this.ministerioScopeId == null) {
      partes.push('Ministerio: todos');
    }

    if (this.searchTerm.trim()) {
      partes.push(`Búsqueda: "${this.searchTerm.trim()}"`);
    }

    if (this.filtroMovimiento !== 'todos') {
      partes.push(`Movimiento: ${this.etiquetaFiltroMovimiento}`);
    }

    return partes.join(' · ');
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
