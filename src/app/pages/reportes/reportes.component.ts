import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonButton, IonSearchbar, ToastController, IonLabel, IonItem, IonSelect, IonSelectOption, IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, expandOutline, closeOutline, downloadOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';

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
export class ReportesComponent implements OnInit {

  listaReportes: Reporte[] = [];
  listaMinisterios: Ministerio[] = [];
  searchTerm: string = '';
  filtroMes: string = '';
  filtroMinisterioId: number | null = null;
  fotoSeleccionada: string | null = null;
  desgloseVisible: Desglose[] = [];

  columnsReportes: TableColumn[] = [
    { field: 'fechaFormateada', header: 'Fecha' },
    { field: 'titulo', header: 'Título del Reporte' },
    { field: 'tipo', header: 'Tipo', type: 'badge' },
    { field: 'ingresos', header: 'Ingresos', type: 'currency' },
    { field: 'gastos', header: 'Gastos', type: 'currency' },
    { field: 'saldo', header: 'Saldo', type: 'currency' }
  ];

  acciones = {
    download: true,
    view: true
  };

  constructor(private toastController: ToastController) {
    addIcons({
      'notifications-outline': notificationsOutline,
      'expand-outline': expandOutline,
      'close-outline': closeOutline,
      'download-outline': downloadOutline
    });
  }

  ngOnInit() {
    this.cargarDatos();
    this.cargarMinisterios();
  }

  @HostListener('document:keydown.escape', [])
  handleEscapeKey() {
    if (this.fotoSeleccionada) {
      this.cerrarImagen();
    }
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

  private formatearISOaDDMMYYYY(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  get listaFiltrada() {
    let filtrados = [...this.listaReportes];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(r =>
        r.titulo?.toLowerCase().includes(search) ||
        r.tipo?.toLowerCase().includes(search)
      );
    }

    if (this.filtroMes) {
      filtrados = filtrados.filter(r => r.mes?.startsWith(this.filtroMes));
    }

    if (this.filtroMinisterioId !== null) {
      filtrados = filtrados.filter(r => r.ministerioId === this.filtroMinisterioId);
    }

    return filtrados;
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

  // Calcula desglose por categoría de todos los reportes filtrados
  get desgloseAgregado(): Desglose[] {
    const desgloseMap = new Map<string, Desglose>();

    this.listaFiltrada.forEach(reporte => {
      if (reporte.desglose) {
        reporte.desglose.forEach(item => {
          const existing = desgloseMap.get(item.categoria) || {
            categoria: item.categoria,
            ingresos: 0,
            gastos: 0,
            saldo: 0
          };
          existing.ingresos += item.ingresos;
          existing.gastos += item.gastos;
          existing.saldo = existing.ingresos - existing.gastos;
          desgloseMap.set(item.categoria, existing);
        });
      }
    });

    return Array.from(desgloseMap.values());
  }

  descargarReporte(item: Reporte) {
    this.mostrarToast(`Descargando reporte: ${item.titulo}`, 'success');
  }

  cargarMinisterios() {
    const datosMinisterios = localStorage.getItem('ministerios');
    if (datosMinisterios) {
      try {
        const ministerios = JSON.parse(datosMinisterios);
        this.listaMinisterios = ministerios.map((m: any, idx: number) => ({
          id: m.id || idx,
          nombre: m.nombre
        }));
      } catch (e) {
        this.listaMinisterios = [];
      }
    }
  }

  cargarDatos() {
    const data = localStorage.getItem('reportes');
    if (data) {
      try {
        this.listaReportes = JSON.parse(data);
        this.listaReportes = this.listaReportes.map(r => ({
          ...r,
          fechaFormateada: this.formatearISOaDDMMYYYY(r.fecha),
          mes: new Date(r.fecha).toISOString().substring(0, 7)
        }));
      } catch (e) {
        this.listaReportes = [];
      }
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
}
