import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton, IonButtons, IonIcon, IonPopover, IonContent,
  IonList, IonItem, IonLabel, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline, cashOutline, trendingDownOutline,
  lockClosedOutline, checkmarkDoneOutline
} from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Notificacion } from '../../core/models/notificacion.model';

@Component({
  selector: 'app-notificaciones-bell',
  standalone: true,
  host: {
    slot: 'end',
    class: 'ieca-notificaciones-bell-host'
  },
  imports: [
    CommonModule,
    IonButtons,
    IonButton,
    IonIcon,
    IonPopover,
    IonContent,
    IonList,
    IonItem,
    IonLabel
  ],
  templateUrl: './notificaciones-bell.component.html',
  styleUrls: ['./notificaciones-bell.component.scss']
})
export class NotificacionesBellComponent implements OnInit, OnDestroy {

  @HostBinding('class.ieca-notificaciones-bell-host--hidden')
  oculto = true;

  visible = false;
  popoverAbierto = false;
  lista: Notificacion[] = [];
  noLeidas = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly notificacionesService: NotificacionesService,
    private readonly navCtrl: NavController
  ) {
    addIcons({
      'notifications-outline': notificationsOutline,
      'cash-outline': cashOutline,
      'trending-down-outline': trendingDownOutline,
      'lock-closed-outline': lockClosedOutline,
      'checkmark-done-outline': checkmarkDoneOutline
    });
  }

  ngOnInit(): void {
    this.actualizarVisibilidad();

    this.authService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.actualizarVisibilidad();
        this.notificacionesService.recargar();
        this.actualizarLista();
      });

    this.notificacionesService.lista$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.actualizarLista());
  }

  private actualizarLista(): void {
    const uid = this.authService.getSession()?.id ?? '';
    this.lista    = this.notificacionesService.getLista();
    this.noLeidas = this.notificacionesService.getNoLeidasCount(uid);
  }

  esNoLeida(n: Notificacion): boolean {
    const uid = this.authService.getSession()?.id ?? '';
    return uid ? !this.notificacionesService.estaLeidaPor(n, uid) : false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private actualizarVisibilidad(): void {
    this.visible =
      this.authService.isAdministrador() || this.authService.isContable();
    this.oculto = !this.visible;
  }

  iconoPara(n: Notificacion): string {
    if (n.tipo === 'ingreso') return 'cash-outline';
    if (n.tipo === 'gasto') return 'trending-down-outline';
    return 'lock-closed-outline';
  }

  async abrirNotificacion(n: Notificacion, popover: IonPopover): Promise<void> {
    const uid = this.authService.getSession()?.id;
    if (uid) {
      this.notificacionesService.marcarLeida(n.id, uid);
    }
    await popover.dismiss();
    if (n.ruta) {
      await this.navCtrl.navigateRoot(n.ruta, { animated: false });
    }
  }

  marcarTodasLeidas(): void {
    const uid = this.authService.getSession()?.id;
    if (uid) {
      this.notificacionesService.marcarTodasLeidas(uid);
    }
  }

  tiempo(fecha: string): string {
    return this.notificacionesService.tiempoRelativo(fecha);
  }
}
