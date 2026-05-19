import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonButton, IonSearchbar, ToastController, IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, expandOutline, closeOutline, downloadOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';

registerLocaleData(localeEs);

interface Reporte {
  id: number;
  fecha: string;
  titulo: string;
  tipo: string;
  ingresos: number;
  gastos: number;
  saldo: number;
  archivo: string;
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
    TablaGeneralComponent
  ],
  providers: [ToastController]
})
export class ReportesComponent implements OnInit {

  listaReportes: Reporte[] = [];
  searchTerm: string = '';
  fotoSeleccionada: string | null = null;

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

    return filtrados;
  }

  descargarReporte(item: Reporte) {
    this.mostrarToast(`Descargando reporte: ${item.titulo}`, 'success');
  }

  cargarDatos() {
    const data = localStorage.getItem('reportes');
    if (data) {
      try {
        this.listaReportes = JSON.parse(data);
        this.listaReportes = this.listaReportes.map(r => ({
          ...r,
          fechaFormateada: this.formatearISOaDDMMYYYY(r.fecha)
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
