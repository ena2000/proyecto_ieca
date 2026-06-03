import { Component, ElementRef, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton, IonButtons, IonIcon, IonPopover,
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
    IonList,
    IonItem,
    IonLabel
  ],
  templateUrl: './notificaciones-bell.component.html',
  styleUrls: ['./notificaciones-bell.component.scss']
})
export class NotificacionesBellComponent implements OnInit, OnDestroy {

  @ViewChild('notifPopover') popoverRef?: IonPopover;
  @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLElement>;

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
    const session = this.authService.getSession();
    const uid = session?.id ?? '';
    const rol = this.authService.getRol();
    const ministerioId = this.authService.getMinisterioScopeId();
    this.lista = this.notificacionesService.getListaParaSesion(rol, ministerioId, uid);
    this.noLeidas = this.notificacionesService.getNoLeidasCount(uid, rol, ministerioId);
  }

  esNoLeida(n: Notificacion): boolean {
    const uid = this.authService.getSession()?.id ?? '';
    return uid ? !this.notificacionesService.estaLeidaPor(n, uid) : false;
  }

  ngOnDestroy(): void {
    void this.popoverRef?.dismiss();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private actualizarVisibilidad(): void {
    this.visible =
      this.authService.isAdministrador() ||
      this.authService.isContable() ||
      this.authService.isLider();
    this.oculto = !this.visible;
  }

  iconoPara(n: Notificacion): string {
    if (n.tipo === 'ingreso') return 'cash-outline';
    if (n.tipo === 'gasto') return 'trending-down-outline';
    return 'lock-closed-outline';
  }

  /** Abre/cierra el popover sin depender de trigger HTML (evita fallos al reabrir). */
  async togglePopover(ev: Event): Promise<void> {
    ev.stopPropagation();
    const popover = this.popoverRef;
    if (!popover) return;

    if (this.popoverAbierto) {
      await popover.dismiss();
      return;
    }

    popover.event = ev;
    await popover.present();
  }

  onPopoverDismiss(): void {
    this.popoverAbierto = false;
  }

  onPopoverPresent(): void {
    this.popoverAbierto = true;
    this.actualizarLista();
  }

  /** La rueda del mouse suele irse a la página; forzamos scroll en el panel. */
  onScrollWheel(event: WheelEvent): void {
    const el = this.scrollArea?.nativeElement;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    el.scrollTop = Math.max(0, Math.min(maxScroll, el.scrollTop + event.deltaY));
    event.preventDefault();
    event.stopPropagation();
  }

  async abrirNotificacion(n: Notificacion, ev: Event): Promise<void> {
    ev.stopPropagation();
    const uid = this.authService.getSession()?.id;
    if (uid) {
      this.notificacionesService.marcarLeida(n.id, uid);
    }

    this.popoverAbierto = false;
    await this.popoverRef?.dismiss();

    if (n.ruta) {
      await this.navCtrl.navigateRoot(n.ruta, { animated: false });
    }
  }

  marcarTodasLeidas(ev: Event): void {
    ev.stopPropagation();
    const uid = this.authService.getSession()?.id;
    if (uid) {
      this.notificacionesService.marcarTodasLeidas(uid);
    }
  }

  tiempo(fecha: string): string {
    return this.notificacionesService.tiempoRelativo(fecha);
  }
}
