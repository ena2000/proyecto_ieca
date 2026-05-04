import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabla-general',
  templateUrl: './tabla-general.component.html',
  styleUrls: ['./tabla-general.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class TablaGeneralComponent {

  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  @Input() actions: any = {};

  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  edit(row: any) {
    this.onEdit.emit(row);
  }

  delete(row: any) {
    this.onDelete.emit(row);
  }

  addIcons() {
    addIcons({ 
      'pencil-outline': pencilOutline,
      'trash-outline': trashOutline
    });
  }
}