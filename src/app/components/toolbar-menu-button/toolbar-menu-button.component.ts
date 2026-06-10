import { Component } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { SidebarUiService } from '../../core/services/sidebar-ui.service';

@Component({
  selector: 'app-toolbar-menu-button',
  standalone: true,
  imports: [IonButton, IonIcon],
  styles: [`
    :host {
      display: none;
    }
    @media (max-width: 768px) {
      :host {
        display: inline-flex;
      }
    }
    .ieca-toolbar-menu-btn {
      --padding-start: 6px;
      --padding-end: 6px;
      min-width: 44px;
      min-height: 44px;
      margin: 0;
    }
    .ieca-toolbar-menu-btn ion-icon {
      font-size: 1.65rem;
    }
  `],
  template: `
    <ion-button
      fill="clear"
      class="ieca-toolbar-menu-btn"
      aria-label="Abrir menú"
      (click)="abrirMenu($event)">
      <ion-icon slot="icon-only" name="menu-outline" color="primary"></ion-icon>
    </ion-button>
  `
})
export class ToolbarMenuButtonComponent {
  constructor(private readonly sidebarUi: SidebarUiService) {}

  abrirMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.sidebarUi.toggleMobile();
  }
}
