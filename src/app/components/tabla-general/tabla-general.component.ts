import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { IonIcon, IonSpinner} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import {
  pencilOutline,
  trashOutline,
  imageOutline,
  chevronBackOutline,
  chevronForwardOutline,
  searchOutline,
  closeOutline
} from 'ionicons/icons';


// =========================================================
// TIPADO FUERTE (MUY IMPORTANTE)
// =========================================================
export type ColumnType = 'text' | 'image' | 'badge' | 'currency' | 'date';

export interface TableColumn {
  field: string;
  header: string;
  type?: ColumnType;
}

export interface TableActions {
  edit?: boolean;
  delete?: boolean;
}


// =========================================================
// COMPONENTE
// =========================================================
@Component({
  selector: 'app-tabla-general',
  templateUrl: './tabla-general.component.html',
  styleUrls: ['./tabla-general.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonSpinner]
})
export class TablaGeneralComponent implements OnInit, OnChanges {

  // =========================================================
  // INPUTS TIPADOS
  // =========================================================
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableActions = {};
  @Input() itemsPerPage: number = 5;
  @Input() loading: boolean = false;

  // =========================================================
  // OUTPUTS
  // =========================================================
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  // =========================================================
  // ESTADO PAGINACIÓN
  // =========================================================
  currentPage: number = 1;

  // =========================================================
  // LIGHTBOX
  // =========================================================
  selectedImage: string | null = null;

  // =========================================================
  // UX STATES (PRO LEVEL)
  // =========================================================
  editingRowId: number | null = null;
  deletingRowId: number | null = null;

  constructor() {
    addIcons({
      pencilOutline,
      trashOutline,
      imageOutline,
      chevronBackOutline,
      chevronForwardOutline,
      searchOutline,
      closeOutline
    });
  }

  // =========================================================
  // ESC CLOSE LIGHTBOX
  // =========================================================
  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.closeLightbox();
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {

    if (changes['data']) {
      const prev = changes['data'].previousValue;
      const curr = changes['data'].currentValue;

      if (prev && curr && prev.length !== curr.length) {
        this.currentPage = 1;
      }
    }
  }

  // =========================================================
  // LIGHTBOX
  // =========================================================
  openLightbox(imageUrl: string) {
    if (!imageUrl) return;

    this.selectedImage = imageUrl;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.selectedImage = null;
    document.body.style.overflow = 'auto';
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================
  get totalPages(): number {
    const pages = Math.ceil(this.data.length / this.itemsPerPage);
    return pages > 0 ? pages : 1;
  }

  get pagedData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.data.slice(start, start + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // =========================================================
  // EDIT
  // =========================================================
  edit(row: any) {
    this.editingRowId = row.id ?? null;
    this.onEdit.emit(row);
  }

  // =========================================================
  // DELETE (CON ESTADO UX)
  // =========================================================
  delete(row: any) {
    this.deletingRowId = row.id ?? null;

    // emit inmediato (el padre maneja lógica real)
    this.onDelete.emit(row);

    // reset visual state
    setTimeout(() => {
      this.deletingRowId = null;
    }, 500);
  }

  // =========================================================
  // HELPERS UX
  // =========================================================
  isEditing(row: any): boolean {
    return this.editingRowId === row?.id;
  }

  isDeleting(row: any): boolean {
    return this.deletingRowId === row?.id;
  }
}