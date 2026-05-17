import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline, imageOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabla-general',
  templateUrl: './tabla-general.component.html',
  styleUrls: ['./tabla-general.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class TablaGeneralComponent implements OnInit, OnChanges {

  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  @Input() actions: any = {};
  @Input() itemsPerPage: number = 5; // Paginación de 5 en 5

  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  currentPage: number = 1;

  constructor() {
    addIcons({ pencilOutline, trashOutline, imageOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit() {}

  // 🔥 Reiniciar página si los datos cambian (por búsqueda)
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.currentPage = 1;
    }
  }

  // Lógica de Paginación
  get totalPages(): number {
    return Math.ceil(this.data.length / this.itemsPerPage) || 1;
  }

  get pagedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.data.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  edit(row: any) { this.onEdit.emit(row); }
  delete(row: any) { this.onDelete.emit(row); }
}