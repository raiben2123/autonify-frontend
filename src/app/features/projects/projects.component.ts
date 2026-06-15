import {
  Component, inject, signal, computed, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsService } from './projects.service';
import { PermissionService } from '../../core/auth/permission.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { TextareaComponent } from '../../shared/components/textarea/textarea.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { BadgeVariant } from '../../shared/components/badge/badge.component';
import {
  ProjectResponse, ProjectStatus,
  CreateProjectRequest, UpdateProjectRequest,
} from '../../core/models/project.model';
import { Page } from '../../core/models/api.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent, BadgeComponent, ButtonComponent,
    InputComponent, SelectComponent, TextareaComponent,
    ModalComponent, SpinnerComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private svc         = inject(ProjectsService);
  readonly permissions = inject(PermissionService);
  private destroy$    = new Subject<void>();
  data    = signal<Page<ProjectResponse> | null>(null);
  loading = signal(true);
  error   = signal('');

  search     = signal('');
  currentPage = signal(0);

  private searchSubject = new Subject<string>();
  showModal   = signal(false);
  modalMode   = signal<'create' | 'edit'>('create');
  editId      = signal<string | null>(null);
  saving      = signal(false);
  modalError  = signal('');
  fName        = signal('');
  fDescription = signal('');
  fCode        = signal('');
  fStatus      = signal<ProjectStatus>('ACTIVE');
  fBillable    = signal(false);
  fHourlyRate  = signal('');
  fStartDate   = signal('');
  fEndDate     = signal('');
  showDeleteModal = signal(false);
  deleteId        = signal<string | null>(null);
  deleteName      = signal('');
  deleting        = signal(false);
  canCreate = computed(() => this.permissions.canAccess('projects') && !this.permissions.isMember);
  canEdit   = computed(() => this.canCreate());
  canDelete = computed(() => this.permissions.isOwner);

  statusOptions = [
    { value: 'ACTIVE',    label: 'Activo' },
    { value: 'ON_HOLD',   label: 'En pausa' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ];

  ngOnInit(): void {
    this.load();
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => {
      this.currentPage.set(0);
      this.search.set(q);
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.list(this.currentPage(), 20, this.search() || undefined).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar los proyectos'); this.loading.set(false); },
    });
  }

  onSearch(q: string): void {
    this.searchSubject.next(q);
  }

  goToPage(p: number): void {
    this.currentPage.set(p);
    this.load();
  }
  openCreate(): void {
    this.modalMode.set('create');
    this.editId.set(null);
    this.resetForm();
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(p: ProjectResponse): void {
    this.modalMode.set('edit');
    this.editId.set(p.id);
    this.fName.set(p.name);
    this.fDescription.set(p.description ?? '');
    this.fCode.set(p.code ?? '');
    this.fStatus.set(p.status);
    this.fBillable.set(p.billable);
    this.fHourlyRate.set(p.hourlyRate?.toString() ?? '');
    this.fStartDate.set(p.startDate ?? '');
    this.fEndDate.set(p.endDate ?? '');
    this.modalError.set('');
    this.showModal.set(true);
  }

  save(): void {
    if (!this.fName().trim()) {
      this.modalError.set('El nombre del proyecto es obligatorio');
      return;
    }
    this.saving.set(true);
    this.modalError.set('');

    const body: CreateProjectRequest = {
      name:        this.fName().trim(),
      description: this.fDescription() || undefined,
      code:        this.fCode() || undefined,
      billable:    this.fBillable(),
      hourlyRate:  this.fHourlyRate() ? +this.fHourlyRate() : undefined,
      startDate:   this.fStartDate() || undefined,
      endDate:     this.fEndDate() || undefined,
    };

    const req = this.modalMode() === 'create'
      ? this.svc.create(body)
      : this.svc.update(this.editId()!, { ...body, status: this.fStatus() } as UpdateProjectRequest);

    req.subscribe({
      next: () => { this.showModal.set(false); this.load(); this.saving.set(false); },
      error: () => { this.modalError.set('Error al guardar el proyecto'); this.saving.set(false); },
    });
  }

  openDelete(p: ProjectResponse): void {
    this.deleteId.set(p.id);
    this.deleteName.set(p.name);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    if (!this.deleteId()) return;
    this.deleting.set(true);
    this.svc.delete(this.deleteId()!).subscribe({
      next:  () => { this.showDeleteModal.set(false); this.load(); this.deleting.set(false); },
      error: () => { this.deleting.set(false); },
    });
  }

  private resetForm(): void {
    this.fName.set('');
    this.fDescription.set('');
    this.fCode.set('');
    this.fStatus.set('ACTIVE');
    this.fBillable.set(false);
    this.fHourlyRate.set('');
    this.fStartDate.set('');
    this.fEndDate.set('');
  }

  setStatus(value: unknown): void {
    this.fStatus.set(value as ProjectStatus);
  }
  statusLabel(s: ProjectStatus): string {
    const m: Record<ProjectStatus, string> = {
      ACTIVE: 'Activo', ON_HOLD: 'En pausa',
      COMPLETED: 'Completado', CANCELLED: 'Cancelado',
    };
    return m[s];
  }

  statusBadge(s: ProjectStatus): BadgeVariant {
    const m: Record<ProjectStatus, BadgeVariant> = {
      ACTIVE: 'success', ON_HOLD: 'warning',
      COMPLETED: 'info', CANCELLED: 'default',
    };
    return m[s];
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  pages(): number[] {
    const total = this.data()?.totalPages ?? 0;
    return Array.from({ length: total }, (_, i) => i);
  }
}
