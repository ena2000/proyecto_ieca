import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { ViewWillEnter } from '@ionic/angular';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonDatetime, IonInput, IonButton,
  IonSearchbar, ToastController, IonPopover, IonBadge, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline, cashOutline, documentTextOutline, cloudUploadOutline,
  saveOutline, notificationsOutline, pencilOutline, trashOutline,
  closeCircleOutline, expandOutline, closeOutline, addCircleOutline, optionsOutline
} from 'ionicons/icons';

import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { formatearISOaDDMMYYYY } from '../../shared/utils/date.util';
import { validarArchivoImagen, comprimirImagen } from '../../shared/utils/image-upload.util';
import { withLoading } from '../../shared/utils/loading.util';
import { Ingreso, Ministerio, Usuario } from '../../core/models';
import { DataService } from '../../services/data.service';
import { IngresosService } from '../../services/ingresos.service';
import { AuthService } from '../../core/services/auth.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss'],
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
    IonItem,
    IonLabel,
    IonDatetime,
    IonInput,
    IonButton,
    IonSearchbar,
    IonPopover,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonSelectOption,
    IonSelect,
    TablaGeneralComponent,
    NotificacionesBellComponent
  ],
  providers: [AlertController, ToastController, LoadingController]
})
export class IngresosComponent implements OnInit, OnDestroy, ViewWillEnter {

  fechaManualForm: string = '';

  // ✅ Tipado con interfaces del DataService
  listaMinisterios: Ministerio[] = [];
  listaUsuarios: Usuario[] = [];

  nuevoIngreso: Ingreso = {
    id: 0,
    fecha: new Date().toISOString(),
    descripcion: '',
    monto: null,
    foto: '',
    tipo: 'Ofrenda',
    ministerio: 'General',
    ministerioId: undefined,
    usuarioId: undefined,
    registradoPor: 'Sistema'
  };

  intentoEnvio = false;
  modoEdicion = false;
  idEditando: number | null = null;
  listaIngresos: Ingreso[] = [];

  private destroy$ = new Subject<void>();

  searchTerm: string = '';
  fechaManualDesde: string = '';
  fechaManualHasta: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroMontoMin: number | null = null;
  filtroMontoMax: number | null = null;

  fotoSeleccionada: string | null = null;

  tiposIngreso: string[] = ['Ofrenda', 'Diezmo', 'Talento', 'Donación', 'Otro'];

  columnsIngresos: TableColumn[] = [
    { field: 'foto',            header: 'Evidencia', type: 'image'    },
    { field: 'fechaFormateada', header: 'Fecha'                       },
    { field: 'tipo',            header: 'Tipo',      type: 'badge'    },
    { field: 'ministerio',      header: 'Ministerio'                  },
    { field: 'descripcion',     header: 'Descripción'                 },
    { field: 'monto',           header: 'Monto',     type: 'currency' }
  ];

  acciones = { edit: true, delete: true };
  soloLectura = false;
  ministerioScopeId: number | null = null;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private dataService: DataService,
    private ingresosService: IngresosService,
    private authService: AuthService
  ) {
    addIcons({
      'calendar-outline':       calendarOutline,
      'cash-outline':           cashOutline,
      'document-text-outline':  documentTextOutline,
      'cloud-upload-outline':   cloudUploadOutline,
      'save-outline':           saveOutline,
      'notifications-outline':  notificationsOutline,
      'pencil-outline':         pencilOutline,
      'trash-outline':          trashOutline,
      'close-circle-outline':   closeCircleOutline,
      'expand-outline':         expandOutline,
      'close-outline':          closeOutline,
      'add-circle-outline':     addCircleOutline,
      'options-outline':        optionsOutline
    });
  }

  ngOnInit() {
    this.soloLectura = this.authService.isSoloLecturaFinanzas();
    this.ministerioScopeId = this.authService.getMinisterioScopeId();
    if (this.soloLectura) {
      this.acciones = { edit: false, delete: false };
    }

    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    this.ingresosService.ingresos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => { this.listaIngresos = list; });
    this.cargarRelaciones();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    this.dataService.refreshAllData();
    this.cargarRelaciones();
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

  validarFechaManualForm(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
    this.fechaManualForm = val;

    if (val.length === 10) {
      const parts   = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        this.nuevoIngreso.fecha = dateObj.toISOString();
      }
    }
  }

  onFechaPickerChange(event: any, popover: IonPopover) {
    const fechaIso = event.detail.value;
    if (fechaIso) {
      this.nuevoIngreso.fecha = fechaIso;
      this.fechaManualForm    = formatearISOaDDMMYYYY(fechaIso);
      popover.dismiss();
    }
  }

  validarFechaManual(event: any, tipo: 'desde' | 'hasta') {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);

    if (tipo === 'desde') {
      this.fechaManualDesde = val;
    } else {
      this.fechaManualHasta = val;
    }

    if (val.length === 10) {
      const parts   = val.split('/');
      const dateObj = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(dateObj.getTime())) {
        const iso = dateObj.toISOString();
        if (tipo === 'desde') {
          this.filtroFechaInicio = iso;
        } else {
          this.filtroFechaFin = iso;
        }
      }
    }
  }

  onPickerDateChange(event: any, tipo: 'desde' | 'hasta', popover: IonPopover) {
    const fechaIso = event.detail.value;
    if (fechaIso) {
      const formateada = formatearISOaDDMMYYYY(fechaIso);
      if (tipo === 'desde') {
        this.filtroFechaInicio = fechaIso;
        this.fechaManualDesde  = formateada;
      } else {
        this.filtroFechaFin   = fechaIso;
        this.fechaManualHasta = formateada;
      }
      popover.dismiss();
    }
  }

  get ministerioBloqueado(): boolean {
    return this.ministerioScopeId != null;
  }

  get ministeriosFormulario(): Ministerio[] {
    if (this.ministerioScopeId == null) {
      return this.listaMinisterios;
    }
    return this.listaMinisterios.filter(m => Number(m.id) === this.ministerioScopeId);
  }

  private aplicarAlcanceMinisterioAlFormulario(): void {
    if (this.ministerioScopeId == null) return;
    const min = this.listaMinisterios.find(m => Number(m.id) === this.ministerioScopeId);
    this.nuevoIngreso.ministerioId = this.ministerioScopeId;
    if (min?.nombre) {
      this.nuevoIngreso.ministerio = min.nombre;
    }
  }

  private perteneceAlcance(item: { ministerioId?: number }): boolean {
    if (this.ministerioScopeId == null) return true;
    return Number(item.ministerioId) === this.ministerioScopeId;
  }

  get hayFiltrosActivos(): boolean {
    return !!this.searchTerm ||
      !!this.filtroFechaInicio ||
      !!this.filtroFechaFin ||
      !!this.fechaManualDesde ||
      !!this.fechaManualHasta ||
      this.filtroMontoMin !== null ||
      this.filtroMontoMax !== null;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.fechaManualDesde = '';
    this.fechaManualHasta = '';
    this.filtroMontoMin = null;
    this.filtroMontoMax = null;
  }

  get listaFiltrada(): Ingreso[] {
    let filtrados = [...this.listaIngresos];

    if (this.ministerioScopeId != null) {
      filtrados = filtrados.filter(i => Number(i.ministerioId) === this.ministerioScopeId);
    }

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(i =>
        i.descripcion?.toLowerCase().includes(search) ||
        i.tipo?.toLowerCase().includes(search)
      );
    }

    if (this.filtroFechaInicio) {
      const inicio = new Date(this.filtroFechaInicio).setHours(0, 0, 0, 0);
      filtrados = filtrados.filter(i => new Date(i.fecha).setHours(0, 0, 0, 0) >= inicio);
    }

    if (this.filtroFechaFin) {
      const fin = new Date(this.filtroFechaFin).setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(i => new Date(i.fecha).setHours(0, 0, 0, 0) <= fin);
    }

    if (this.filtroMontoMin !== null) {
      filtrados = filtrados.filter(i => (i.monto || 0) >= this.filtroMontoMin!);
    }
    if (this.filtroMontoMax !== null) {
      filtrados = filtrados.filter(i => (i.monto || 0) <= this.filtroMontoMax!);
    }

    return filtrados;
  }

  async registrarIngreso() {
    this.intentoEnvio = true;
    this.aplicarAlcanceMinisterioAlFormulario();
    if (!this.esFormularioValido) {
      this.mostrarToast(this.mensajeValidacion, 'danger');
      return;
    }

    this.cargarRelaciones();

    const fechaFormateada = this.fechaManualForm;
    const preparado = this.ingresosService.resolveRelations(
      this.nuevoIngreso,
      this.listaMinisterios,
      this.listaUsuarios
    );

    const guardando = this.modoEdicion ? 'Actualizando registro...' : 'Guardando ingreso...';

    try {
      await withLoading(this.loadingController, guardando, async () => {
        if (this.modoEdicion && this.idEditando !== null) {
          await firstValueFrom(this.ingresosService.update(this.idEditando, preparado, fechaFormateada));
          await this.mostrarToast('Registro actualizado exitosamente', 'success');
        } else {
          await firstValueFrom(this.ingresosService.create(preparado, fechaFormateada));
          await this.mostrarToast('Registro creado exitosamente', 'success');
        }
      });

      this.dataService.notifyChanges();
      this.resetFormulario();
    } catch (error) {
      const msg = error instanceof Error
        ? (error.message === 'STORAGE_QUOTA'
          ? 'No se pudo guardar. La imagen es muy grande; intenta sin foto o con otra más pequeña.'
          : error.message)
        : 'Error al guardar el registro';
      this.mostrarToast(msg, 'danger');
    }
  }

  editarIngreso(item: Ingreso) {
    if (!this.perteneceAlcance(item)) {
      this.mostrarToast('No puedes editar registros de otro ministerio.', 'warning');
      return;
    }
    this.nuevoIngreso.foto = '';
    setTimeout(() => {
      this.nuevoIngreso    = { ...item };
      this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
      this.modoEdicion     = true;
      this.idEditando      = item.id;
      this.intentoEnvio    = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async eliminarIngreso(item: Ingreso) {
    if (!this.perteneceAlcance(item)) {
      this.mostrarToast('No puedes eliminar registros de otro ministerio.', 'warning');
      return;
    }
    const alert = await this.alertController.create({
      header:  'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el registro #${item.id}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Eliminar',
          role:    'destructive',
          handler: async () => {
            try {
              await withLoading(this.loadingController, 'Eliminando registro...', async () => {
                await firstValueFrom(this.ingresosService.delete(item.id));
              });
              this.dataService.notifyChanges();
              this.mostrarToast('Registro eliminado', 'warning');
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'Error al eliminar';
              this.mostrarToast(msg, 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  resetFormulario() {
    this.nuevoIngreso = {
      id:            0,
      fecha:         new Date().toISOString(),
      descripcion:   '',
      monto:         null,
      foto:          '',
      tipo:          'Ofrenda',
      ministerio:    'General',
      ministerioId:  undefined,
      usuarioId:     undefined,
      registradoPor: 'Sistema'
    };
    this.fechaManualForm = formatearISOaDDMMYYYY(this.nuevoIngreso.fecha);
    this.modoEdicion     = false;
    this.idEditando      = null;
    this.intentoEnvio    = false;
    this.aplicarAlcanceMinisterioAlFormulario();
  }

  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const validacion = validarArchivoImagen(file);
    if (!validacion.valid) {
      this.mostrarToast(validacion.error ?? 'Archivo no válido.', 'danger');
      input.value = '';
      return;
    }

    try {
      this.nuevoIngreso.foto = await comprimirImagen(file);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo procesar la imagen.';
      this.mostrarToast(msg, 'danger');
      input.value = '';
    }
  }

  eliminarFoto() {
    this.nuevoIngreso.foto = '';
  }

  cargarRelaciones() {
    this.listaMinisterios = this.dataService.getMinisteriosActuales();
    this.listaUsuarios    = this.dataService.getUsuariosActuales();
    this.aplicarAlcanceMinisterioAlFormulario();
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

  get esFormularioValido(): boolean {
    const ministerioOk =
      this.ministerioScopeId != null ||
      this.listaMinisterios.length === 0 ||
      this.nuevoIngreso.ministerioId != null;
    return (
      this.nuevoIngreso.descripcion?.trim().length >= 3 &&
      this.nuevoIngreso.monto !== null &&
      this.nuevoIngreso.monto > 0 &&
      this.fechaManualForm.length === 10 &&
      ministerioOk
    );
  }

  get mensajeValidacion(): string {
    const monto = Number(this.nuevoIngreso.monto);
    if (!Number.isFinite(monto) || monto <= 0) return 'Ingresa un monto válido mayor a cero.';
    if (this.listaMinisterios.length > 0 && this.ministerioScopeId == null && !this.nuevoIngreso.ministerioId) {
      return 'Selecciona un ministerio.';
    }
    if ((this.nuevoIngreso.descripcion?.trim().length ?? 0) < 3) {
      return 'La descripción debe tener al menos 3 caracteres.';
    }
    if (this.fechaManualForm.length !== 10) return 'Ingresa una fecha válida (DD/MM/AAAA).';
    return 'Por favor, completa los campos obligatorios correctamente.';
  }
}