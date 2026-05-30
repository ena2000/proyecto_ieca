import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonModal, IonButton, IonInput, IonItem, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-modal-form',
  standalone: true,
  templateUrl: './modal-form.component.html',
  styleUrls: ['./modal-form.component.scss'],
  imports: [CommonModule, FormsModule, IonModal, IonButton, IonInput, IonItem, IonLabel]
})
export class ModalFormComponent {

  @Input() isOpen: boolean = false;
  @Input() titulo: string = 'Formulario';
  @Input() fields: any[] = []; // 👈 dinámico
  @Input() data: any = {};     // 👈 datos a editar

  @Output() modalDismiss = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  cerrar() {
    this.modalDismiss.emit();
  }

  guardar() {
    this.save.emit(this.data);
  }
}