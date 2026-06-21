import {
  Component,
  Input,
  Output,
  EventEmitter,
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
  closeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  readerOutline
} from 'ionicons/icons';

import { estaPendienteParaAprobacion } from '../../shared/utils/movimiento-estado.util';


// =========================================================
// TIPADO FUERTE (MUY IMPORTANTE)
// =========================================================
export type ColumnType = 'text' | 'image' | 'evidence' | 'badge' | 'currency' | 'date';

export interface TableColumn {
  field: string;
  header: string;
  type?: ColumnType;
}

export interface TableActions {
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  reject?: boolean;
  ledger?: boolean;
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
export class TablaGeneralComponent implements OnChanges {

  // =========================================================
  // INPUTS TIPADOS
  // =========================================================
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableActions = {};
  @Input() itemsPerPage: number = 5;
  @Input() loading: boolean = false;
  /** Permite editar filas aunque estén aprobadas (p. ej. administrador). */
  @Input() allowEditApproved = false;
  @Input() allowDeleteApproved = false;

  // =========================================================
  // OUTPUTS
  // =========================================================
  @Output() rowEdit = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<any>();
  @Output() rowApprove = new EventEmitter<any>();
  @Output() rowReject = new EventEmitter<any>();
  @Output() rowLedger = new EventEmitter<any>();
  @Output() evidenceClick = new EventEmitter<string>();

  // =========================================================
  // ESTADO PAGINACIÓN
  // =========================================================
  currentPage: number = 1;

  // =========================================================
  // LIGHTBOX
  // =========================================================
  selectedImage: string | null = null;
  selectedPdf: string | null = null;

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
      closeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      readerOutline
    });
  }

  // =========================================================
  // ESC CLOSE LIGHTBOX
  // =========================================================
  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.closeLightbox();
  }

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
  esPdf(url: string | null | undefined): boolean {
    return !!url && url.startsWith('data:application/pdf');
  }

  openEvidence(url: string) {
    if (!url) return;
    this.evidenceClick.emit(url);
    // Si la página padre maneja el visor (gastos/ingresos), no abrir el lightbox interno.
    if (this.evidenceClick.observed) {
      return;
    }
    if (this.esPdf(url)) {
      this.selectedPdf = url;
      document.body.style.overflow = 'hidden';
      return;
    }
    this.selectedImage = url;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.selectedImage = null;
    this.selectedPdf = null;
    document.body.style.overflow = 'auto';
  }

  approve(row: any) {
    this.rowApprove.emit(row);
  }

  reject(row: any) {
    this.rowReject.emit(row);
  }

  ledger(row: any) {
    this.rowLedger.emit(row);
  }

  showApproveFor(row: any): boolean {
    return !!this.actions.approve && estaPendienteParaAprobacion(row);
  }

  showRejectFor(row: any): boolean {
    return !!this.actions.reject && estaPendienteParaAprobacion(row);
  }

  showEditFor(row: any): boolean {
    if (!this.actions.edit) return false;
    const estado = row?.estado ?? 'aprobado';
    if (this.allowEditApproved) return true;
    return estado !== 'aprobado';
  }

  showDeleteFor(row: any): boolean {
    if (!this.actions.delete) return false;
    const estado = row?.estado ?? 'aprobado';
    if (this.allowDeleteApproved) return true;
    return estado !== 'aprobado';
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
    this.rowEdit.emit(row);
  }

  // =========================================================
  // DELETE (CON ESTADO UX)
  // =========================================================
  delete(row: any) {
    this.deletingRowId = row.id ?? null;

    // emit inmediato (el padre maneja lógica real)
    this.rowDelete.emit(row);

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