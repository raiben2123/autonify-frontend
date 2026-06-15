import {
  Component, inject, signal, computed, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogItemService } from '../catalog.service';
import { CatalogCategoryService } from '../catalog-category.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../shared/components/textarea/textarea.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CatalogCategoryResponse } from '../../../core/models/catalog-category.model';
import {
  CatalogItemResponse,
  CreateCatalogItemRequest,
  UpdateCatalogItemRequest,
  ItemType,
} from '../../../core/models/catalog-item.model';
import { Page } from '../../../core/models/api.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-catalog-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    ModalComponent,
    SpinnerComponent,
  ],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css',
})
export class CatalogItemsComponent implements OnInit, OnDestroy {
  private itemSvc = inject(CatalogItemService);
  private categorySvc = inject(CatalogCategoryService);
  readonly permissions = inject(PermissionService);
  private destroy$ = new Subject<void>();  data = signal<Page<CatalogItemResponse> | null>(null);
  categories = signal<CatalogCategoryResponse[]>([]);
  loading = signal(true);
  error = signal('');
  currentPage = signal(0);  search = signal('');
  filterType = signal<ItemType | ''>('');
  filterCategory = signal('');
  filterActive = signal(true);

  private searchSubject = new Subject<string>();  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editId = signal<string | null>(null);
  saving = signal(false);
  modalError = signal('');  fItemType = signal<ItemType>('PRODUCT');
  fCode = signal('');
  fName = signal('');
  fDescription = signal('');
  fUnitPrice = signal('');
  fTaxRate = signal('');
  fUnit = signal('');
  fCategoryId = signal('');
  fActive = signal(true);  showDeleteModal = signal(false);
  deleteId = signal<string | null>(null);
  deleteName = signal('');
  deleting = signal(false);  canCreate = computed(() => this.permissions.isAdmin || this.permissions.canAccess('catalog'));
  canEdit = computed(() => this.canCreate());
  canDelete = computed(() => this.canCreate());

  itemTypeOptions = [
    { value: 'PRODUCT', label: 'Producto' },
    { value: 'SERVICE', label: 'Servicio' },
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadData();

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((query) => {
        this.currentPage.set(0);
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.categorySvc
      .getActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories.set(response);
        },
        error: (err) => {
          console.error('Error loading categories', err);
        },
      });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');

    const query = this.search().trim();
    const page = this.currentPage();

    const observable = query
      ? this.itemSvc.search(query, page, 20)
      : this.itemSvc.list(page, 20);

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.data.set(response);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar los items');
          this.loading.set(false);
          console.error(err);
        },
      });
  }

  onSearch(query: string): void {
    this.search.set(query);
    this.searchSubject.next(query);
  }

  openCreate(): void {
    this.modalMode.set('create');
    this.editId.set(null);
    this.resetForm();
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(item: CatalogItemResponse): void {
    this.modalMode.set('edit');
    this.editId.set(item.id);
    this.fItemType.set(item.itemType);
    this.fCode.set(item.code || '');
    this.fName.set(item.name);
    this.fDescription.set(item.description || '');
    this.fUnitPrice.set(String(item.unitPrice));
    this.fTaxRate.set(String(item.taxRate || 0));
    this.fUnit.set(item.unit || '');
    this.fCategoryId.set(item.categoryId || '');
    this.fActive.set(item.active);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
    this.modalError.set('');
  }

  resetForm(): void {
    this.fItemType.set('PRODUCT');
    this.fCode.set('');
    this.fName.set('');
    this.fDescription.set('');
    this.fUnitPrice.set('');
    this.fTaxRate.set('');
    this.fUnit.set('');
    this.fCategoryId.set('');
    this.fActive.set(true);
  }

  save(): void {
    if (!this.fName()) {
      this.modalError.set('El nombre es obligatorio');
      return;
    }

    if (!this.fUnitPrice()) {
      this.modalError.set('El precio unitario es obligatorio');
      return;
    }

    this.saving.set(true);
    this.modalError.set('');

    if (this.modalMode() === 'create') {
      const request: CreateCatalogItemRequest = {
        itemType: this.fItemType(),
        code: this.fCode(),
        name: this.fName(),
        description: this.fDescription(),
        unitPrice: parseFloat(this.fUnitPrice()),
        taxRate: this.fTaxRate() ? parseFloat(this.fTaxRate()) : undefined,
        unit: this.fUnit(),
        categoryId: this.fCategoryId() || undefined,
      };

      this.itemSvc
        .create(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.closeModal();
            this.loadData();
          },
          error: (err) => {
            this.saving.set(false);
            this.modalError.set(err?.error?.message || 'Error al guardar el item');
            console.error(err);
          },
        });
    } else {
      const request: UpdateCatalogItemRequest = {
        itemType: this.fItemType(),
        code: this.fCode(),
        name: this.fName(),
        description: this.fDescription(),
        unitPrice: parseFloat(this.fUnitPrice()),
        taxRate: this.fTaxRate() ? parseFloat(this.fTaxRate()) : undefined,
        unit: this.fUnit(),
        categoryId: this.fCategoryId() || undefined,
        active: this.fActive(),
      };

      this.itemSvc
        .update(this.editId()!, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.closeModal();
            this.loadData();
          },
          error: (err) => {
            this.saving.set(false);
            this.modalError.set(err?.error?.message || 'Error al guardar el item');
            console.error(err);
          },
        });
    }
  }

  openDelete(item: CatalogItemResponse): void {
    this.deleteId.set(item.id);
    this.deleteName.set(item.name);
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
    this.itemSvc
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

  getCategoryName(categoryId?: string): string {
    if (!categoryId) return '-';
    return this.categories().find((c) => c.id === categoryId)?.name || '-';
  }

  setItemType(value: string): void {
    this.fItemType.set(value as ItemType);
  }

  getCategoryOptions() {
    const options = this.categories().map((c) => ({
      value: c.id,
      label: c.name,
    }));
    return [{ value: '', label: 'Sin categoría' }, ...options];
  }
}
