import {
  Component, inject, signal, computed, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogCategoryService } from '../catalog-category.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { TextareaComponent } from '../../../shared/components/textarea/textarea.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CatalogCategoryRequest, CatalogCategoryResponse } from '../../../core/models/catalog-category.model';
import { Page } from '../../../core/models/api.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-catalog-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    TextareaComponent,
    ModalComponent,
    SpinnerComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CatalogCategoriesComponent implements OnInit, OnDestroy {
  private svc = inject(CatalogCategoryService);
  readonly permissions = inject(PermissionService);
  private destroy$ = new Subject<void>();  data = signal<Page<CatalogCategoryResponse> | null>(null);
  loading = signal(true);
  error = signal('');
  currentPage = signal(0);  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editId = signal<string | null>(null);
  saving = signal(false);
  modalError = signal('');  fName = signal('');
  fDescription = signal('');
  fColor = signal('#3B82F6');
  fSortOrder = signal('0');
  fActive = signal(true);  showDeleteModal = signal(false);
  deleteId = signal<string | null>(null);
  deleteName = signal('');
  deleting = signal(false);  canCreate = computed(() => this.permissions.isAdmin || this.permissions.canAccess('catalog'));
  canEdit = computed(() => this.canCreate());
  canDelete = computed(() => this.canCreate());

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc
      .list(this.currentPage(), 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.data.set(response);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar las categorías');
          this.loading.set(false);
          console.error(err);
        },
      });
  }

  openCreate(): void {
    this.modalMode.set('create');
    this.editId.set(null);
    this.resetForm();
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(category: CatalogCategoryResponse): void {
    this.modalMode.set('edit');
    this.editId.set(category.id);
    this.fName.set(category.name);
    this.fDescription.set(category.description || '');
    this.fColor.set(category.color || '#3B82F6');
    this.fSortOrder.set(String(category.sortOrder || 0));
    this.fActive.set(category.active);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
    this.modalError.set('');
  }

  resetForm(): void {
    this.fName.set('');
    this.fDescription.set('');
    this.fColor.set('#3B82F6');
    this.fSortOrder.set('0');
    this.fActive.set(true);
  }

  save(): void {
    if (!this.fName()) {
      this.modalError.set('El nombre es obligatorio');
      return;
    }

    this.saving.set(true);
    this.modalError.set('');

    const request: CatalogCategoryRequest = {
      name: this.fName(),
      description: this.fDescription(),
      color: this.fColor(),
      sortOrder: parseInt(this.fSortOrder(), 10),
      active: this.fActive(),
    };

    const observable = this.modalMode() === 'create'
      ? this.svc.create(request)
      : this.svc.update(this.editId()!, request);

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          this.modalError.set(err?.error?.message || 'Error al guardar la categoría');
          console.error(err);
        },
      });
  }

  openDelete(category: CatalogCategoryResponse): void {
    this.deleteId.set(category.id);
    this.deleteName.set(category.name);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteId.set(null);
    this.deleteName.set('');
  }

  confirmDelete(): void {
    if (!this.deleteId()) return;
    this.deleting.set(true);
    this.svc
      .delete(this.deleteId()!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.closeDeleteModal();
          this.loadData();
        },
        error: (err) => {
          this.deleting.set(false);
          console.error(err);
        },
      });
  }

  nextPage(): void {
    if (this.data()?.number! < this.data()?.totalPages! - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadData();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadData();
    }
  }
}
