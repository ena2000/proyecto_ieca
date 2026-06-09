import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonInput, IonButton,
  IonSearchbar, IonSelect, IonSelectOption,
  IonModal,
  ToastController
} from '@ionic/angular/standalone';

import { AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  documentTextOutline, saveOutline, notificationsOutline,
  pencilOutline, trashOutline, closeOutline, addCircleOutline, optionsOutline,
  readerOutline, walletOutline
} from 'ionicons/icons';

import { TablaGeneralComponent, TableColumn } from 'src/app/components/tabla-general/tabla-general.component';
import { NotificacionesBellComponent } from 'src/app/components/notificaciones-bell/notificaciones-bell.component';
import { Ministerio, Usuario, KardexLinea } from '../../core/models';
import { DataService } from '../../services/data.service';
import { MinisteriosService } from '../../services/ministerios.service';
import { withLoading } from '../../shared/utils/loading.util';
import { presentIecaToast } from '../../shared/utils/toast.util';
import {
  usuariosElegiblesParaMinisterio,
  validarMinisterioForm
} from '../../shared/utils/liderazgo.util';

registerLocaleData(localeEs);

@Component({
  selector: 'app-ministerios',
  templateUrl: './ministerios.component.html',
  styleUrls: ['./ministerios.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
    IonIcon, IonItem, IonLabel, IonInput, IonButton,
    IonSearchbar, IonSelect, IonSelectOption, IonModal,
    TablaGeneralComponent,
    NotificacionesBellComponent
  ],
  providers: [AlertController, ToastController, LoadingController],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MinisteriosComponent implements OnInit, OnDestroy, ViewWillEnter {

  listaUsuarios: Usuario[] = [];

  nuevoMinisterio: Ministerio = {
    id:         0,
    nombre:     '',
    estado:     'Activo',
    fecha:      '',
    hldrId:     undefined,
    coLiderId:  undefined
  };

  intentoEnvio = false;
  modoEdicion  = false;
  idEditando: number | null = null;
  listaMinisterios: Ministerio[] = [];
  vistaMinisterios: Array<Ministerio & { liderNombre: string; coLiderNombre: string; saldo: number }> = [];
  lideresHldr: Usuario[] = [];
  lideresCo: Usuario[] = [];
  formularioValido = false;

  searchTerm:    string = '';
  filtroLiderId: number | null = null;

  private destroy$ = new Subject<void>();

  columnsMinisterios: TableColumn[] = [
    { field: 'nombre',        header: 'Nombre'                },
    { field: 'liderNombre',   header: 'Líder'                 },
    { field: 'coLiderNombre', header: 'Co-líder'              },
    { field: 'saldo',         header: 'Saldo disponible', type: 'currency' },
    { field: 'estado',        header: 'Estado', type: 'badge' }
  ];

  acciones = { edit: true, delete: true, ledger: true };
  estadosMinisterio: string[] = ['Activo', 'Pausado', 'Inactivo'];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private dataService: DataService,
    private ministeriosService: MinisteriosService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'document-text-outline': documentTextOutline,
      'save-outline':          saveOutline,
      'notifications-outline': notificationsOutline,
      'pencil-outline':        pencilOutline,
      'trash-outline':         trashOutline,
      'close-outline':         closeOutline,
      'add-circle-outline':    addCircleOutline,
      'options-outline':       optionsOutline,
      'reader-outline':        readerOutline,
      'wallet-outline':        walletOutline
    });
  }

  kardexAbierto = false;
  ministerioKardex: Ministerio | null = null;
  lineasKardex: KardexLinea[] = [];

  ngOnInit() {
    this.ministeriosService.ministerios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.listaMinisterios = list;
        this.actualizarVista();
      });
    this.dataService.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarVista());
    this.dataService.dataRevision$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.ministerioKardex) {
          this.lineasKardex = this.dataService.getKardexMinisterio(this.ministerioKardex.id);
        }
        this.actualizarVista();
      });
    this.actualizarVista();
  }

  ionViewWillEnter(): void {
    void this.dataService.bootstrapRemote().then(() => {
      if (!this.ministeriosService.getAll().length) {
        this.ministeriosService.reload();
      }
      this.actualizarVista();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hayFiltrosActivos(): boolean {
    return !!this.searchTerm || this.filtroLiderId !== null;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroLiderId = null;
    this.actualizarVista();
  }

  onFiltrosChange(): void {
    this.actualizarVista();
  }

  onFormularioChange(): void {
    this.actualizarValidacionFormulario();
    this.cdr.markForCheck();
  }

  private actualizarVista(): void {
    this.cargarUsuarios();

    let filtrados = [...this.listaMinisterios];
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(m => m.nombre?.toLowerCase().includes(search));
    }
    if (this.filtroLiderId !== null) {
      filtrados = filtrados.filter(m => m.hldrId === this.filtroLiderId);
    }

    this.vistaMinisterios = filtrados.map(m => ({
      ...m,
      liderNombre: this.nombreUsuario(m.hldrId),
      coLiderNombre: this.nombreUsuario(m.coLiderId),
      saldo: this.dataService.calcularSaldoMinisterio(m.id)
    }));

    this.lideresHldr = usuariosElegiblesParaMinisterio(
      this.listaUsuarios,
      this.listaMinisterios,
      this.ministerioIdForm,
      {
        mantenerUserIds: [this.nuevoMinisterio.hldrId],
        excluirUserIds: [this.nuevoMinisterio.coLiderId]
      }
    );
    this.lideresCo = usuariosElegiblesParaMinisterio(
      this.listaUsuarios,
      this.listaMinisterios,
      this.ministerioIdForm,
      {
        mantenerUserIds: [this.nuevoMinisterio.coLiderId],
        excluirUserIds: [this.nuevoMinisterio.hldrId]
      }
    );

    this.actualizarValidacionFormulario();
    this.cdr.markForCheck();
  }

  private actualizarValidacionFormulario(): void {
    this.formularioValido = this.esFormularioValido;
  }

  get saldoKardexActual(): number {
    if (!this.lineasKardex.length) return 0;
    return this.lineasKardex[this.lineasKardex.length - 1].saldo;
  }

  /** Movimientos del más reciente al más antiguo. */
  get lineasKardexVista(): KardexLinea[] {
    return [...this.lineasKardex].reverse();
  }

  verKardex(item: Ministerio): void {
    this.ministerioKardex = item;
    this.lineasKardex = this.dataService.getKardexMinisterio(item.id);
    this.kardexAbierto = true;
  }

  cerrarKardex(): void {
    this.kardexAbierto = false;
    this.ministerioKardex = null;
    this.lineasKardex = [];
  }

  private nombreUsuario(userId?: number): string {
    if (userId == null) return '—';
    const user = this.listaUsuarios.find(u => Number(u.id) === Number(userId));
    return user?.nombre?.trim() || '—';
  }

  private get ministerioIdForm(): number | null {
    return this.modoEdicion ? this.idEditando : null;
  }

  async registrarMinisterio() {
    this.intentoEnvio = true;
    if (!this.esFormularioValido) {
      this.mostrarToast(this.mensajeValidacion, 'danger');
      return;
    }

    const errorLiderazgo = validarMinisterioForm(
      this.nuevoMinisterio,
      this.listaUsuarios,
      this.listaMinisterios,
      this.modoEdicion ? this.idEditando : null
    );
    if (errorLiderazgo) {
      this.mostrarToast(errorLiderazgo, 'danger');
      return;
    }

    const guardando = this.modoEdicion ? 'Actualizando ministerio...' : 'Guardando ministerio...';

    try {
      await withLoading(this.loadingController, guardando, async () => {
        if (this.modoEdicion && this.idEditando !== null) {
          const existente = this.listaMinisterios.find(m => m.id === this.idEditando);
          await firstValueFrom(this.ministeriosService.update(this.idEditando, {
            ...this.nuevoMinisterio,
            id: this.idEditando,
            fechaFormateada: existente?.fechaFormateada
          }));
          await this.mostrarToast('Registro actualizado exitosamente', 'success');
        } else {
          const { id, fecha, fechaFormateada, ...datos } = this.nuevoMinisterio;
          await firstValueFrom(this.ministeriosService.create(datos));
          await this.mostrarToast('Registro creado exitosamente', 'success');
        }
      });

      this.actualizarVista();
      this.resetFormulario();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      this.mostrarToast(msg, 'danger');
    }
  }

  editarMinisterio(item: Ministerio) {
    setTimeout(() => {
      this.nuevoMinisterio = { ...item };
      this.modoEdicion     = true;
      this.idEditando      = item.id;
      this.intentoEnvio    = false;
      this.actualizarVista();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  async eliminarMinisterio(item: Ministerio) {
    const alert = await this.alertController.create({
      header:  'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el ministerio "${item.nombre?.trim() || 'sin nombre'}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text:    'Eliminar',
          role:    'destructive',
          handler: async () => {
            try {
              await withLoading(this.loadingController, 'Eliminando ministerio...', async () => {
                await firstValueFrom(this.ministeriosService.delete(item.id));
              });
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
    this.nuevoMinisterio = {
      id:        0,
      nombre:    '',
      estado:    'Activo',
      fecha:     '',
      hldrId:    undefined,
      coLiderId: undefined
    };
    this.modoEdicion  = false;
    this.idEditando   = null;
    this.intentoEnvio = false;
    this.actualizarVista();
  }

  private cargarUsuarios(): void {
    this.listaUsuarios = this.dataService.getUsuariosActuales();
  }

  async mostrarToast(mensaje: string, color: string) {
    await presentIecaToast(this.toastController, mensaje, color);
  }

  get esFormularioValido(): boolean {
    if (this.nuevoMinisterio.nombre?.trim().length < 3) return false;
    return validarMinisterioForm(
      this.nuevoMinisterio,
      this.listaUsuarios,
      this.listaMinisterios,
      this.modoEdicion ? this.idEditando : null
    ) == null;
  }

  get mensajeValidacion(): string {
    if (this.nuevoMinisterio.nombre?.trim().length < 3) {
      return 'El nombre del ministerio debe tener al menos 3 caracteres.';
    }
    return validarMinisterioForm(
      this.nuevoMinisterio,
      this.listaUsuarios,
      this.listaMinisterios,
      this.modoEdicion ? this.idEditando : null
    ) ?? 'Revisa los datos del ministerio.';
  }
}
