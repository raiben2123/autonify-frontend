import {
  Component, inject, signal, computed, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeService } from './time.service';
import { ProjectsService } from '../projects/projects.service';
import { SettingsService } from '../settings/settings.service';
import { PermissionService } from '../../core/auth/permission.service';
import { AuthService } from '../../core/auth/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { TimeEntryResponse, CreateTimeEntryRequest, UpdateTimeEntryRequest } from '../../core/models/time-entry.model';
import { ProjectResponse } from '../../core/models/project.model';
import { Page } from '../../core/models/api.model';
import { TeamMember } from '../../core/models/user.model';
import { Subject, interval, takeUntil, catchError, of } from 'rxjs';

@Component({
  selector: 'app-time',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent, ButtonComponent,
    InputComponent, SelectComponent, ModalComponent, SpinnerComponent,
  ],
  templateUrl: './time.component.html',
  styleUrl: './time.component.css',
})
export class TimeComponent implements OnInit, OnDestroy {
  private svc         = inject(TimeService);
  private projectsSvc = inject(ProjectsService);
  private settingsSvc = inject(SettingsService);
  private auth        = inject(AuthService);
  readonly permissions = inject(PermissionService);
  private destroy$    = new Subject<void>();
  usersMap = signal<Record<string, string>>({});
  data        = signal<Page<TimeEntryResponse> | null>(null);
  loading     = signal(true);
  error       = signal('');
  currentPage = signal(0);
  runningEntry  = signal<TimeEntryResponse | null>(null);
  timerSeconds  = signal(0);
  timerProject  = signal('');
  timerDesc     = signal('');
  startingTimer = signal(false);
  stoppingTimer = signal(false);
  timerSubscription = new Subject<void>();  // Para controlar el intervalo del timer
  projects = signal<ProjectResponse[]>([]);
  showModal  = signal(false);
  modalMode  = signal<'create' | 'edit'>('create');
  editId     = signal<string | null>(null);
  saving     = signal(false);
  modalError = signal('');

  fDate             = signal(new Date().toISOString().slice(0, 10));
  fStartTime        = signal('');
  fEndTime          = signal('');
  fDurationMinutes  = signal('');
  fDescription      = signal('');
  fProjectId        = signal('');
  fBillable         = signal(false);
  showDeleteModal = signal(false);
  deleteId        = signal<string | null>(null);
  deleting        = signal(false);
  canCreate = computed(() => this.permissions.canAccess('time'));
  canEdit   = computed(() => this.permissions.canAccess('time'));
  canDelete = computed(() => this.permissions.canAccess('time'));

  timerDisplay = computed(() => {
    const s = this.timerSeconds();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  });

  ngOnInit(): void {
    if (this.permissions.canAccess('ajustes')) {
      this.loadTeamMembers();
    }
    this.loadProjects();
    this.loadRunningTimer();
    this.load();
  }

  private loadTeamMembers(): void {
    this.settingsSvc.getTeam(0, 100).pipe(
      catchError(() => of({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 100,
        number: 0,
      } as Page<TeamMember>)),
      takeUntil(this.destroy$),
    ).subscribe(data => {
      const map: Record<string, string> = {};
      data.content.forEach((member: TeamMember) => {
        map[member.id] = member.fullName;
      });
      this.usersMap.set(map);
    });
  }

  ngOnDestroy(): void {
    this.timerSubscription.next();
    this.timerSubscription.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadProjects(): void {
    this.projectsSvc.list(0, 100).pipe(takeUntil(this.destroy$)).subscribe({
      next: p => this.projects.set(p.content),
    });
  }

  projectOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'Sin proyecto' },
      ...this.projects().map(p => ({ value: p.id, label: p.name })),
    ];
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    const listObservable = this.permissions.canAccess('ajustes')
      ? this.svc.list(this.currentPage())
      : this.svc.listByUser(this.auth.userId(), this.currentPage());

    listObservable.subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar las entradas'); this.loading.set(false); },
    });
  }

  goToPage(p: number): void {
    this.currentPage.set(p);
    this.load();
  }
  loadRunningTimer(): void {
    this.svc.getRunningTimer().pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$),
    ).subscribe(entry => {
      if (entry) {
        this.runningEntry.set(entry);
        this.startTick(entry);
      }
    });
  }

  private startTick(entry: TimeEntryResponse, isNew: boolean = false): void {
    this.timerSubscription.next();
    if (!isNew && entry.startTime && entry.date) {
      const start = new Date(`${entry.date}T${entry.startTime}`);
      const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
      this.timerSeconds.set(Math.max(0, elapsed));
    } else {
      this.timerSeconds.set(0);
    }
    interval(1000).pipe(takeUntil(this.timerSubscription)).subscribe(() => {
      this.timerSeconds.update(s => s + 1);
    });
  }

  startTimer(): void {
    this.startingTimer.set(true);
    this.svc.startTimer({
      projectId:   this.timerProject() || undefined,
      description: this.timerDesc() || undefined,
      billable:    false,
    }).subscribe({
      next: entry => {
        this.runningEntry.set(entry);
        this.timerSeconds.set(0);
        this.startTick(entry, true);  // true = es un timer nuevo
        this.startingTimer.set(false);
      },
      error: () => this.startingTimer.set(false),
    });
  }

  stopTimer(): void {
    const entry = this.runningEntry();
    if (!entry) return;
    this.stoppingTimer.set(true);
    this.timerSubscription.next();
    
    this.svc.stopTimer(entry.id).subscribe({
      next: () => {
        this.runningEntry.set(null);
        this.timerSeconds.set(0);
        this.timerProject.set('');
        this.timerDesc.set('');
        this.stoppingTimer.set(false);
        this.load();
      },
      error: () => this.stoppingTimer.set(false),
    });
  }
  openCreate(): void {
    this.modalMode.set('create');
    this.editId.set(null);
    this.fDate.set(new Date().toISOString().slice(0, 10));
    this.fStartTime.set('');
    this.fEndTime.set('');
    this.fDurationMinutes.set('');
    this.fDescription.set('');
    this.fProjectId.set('');
    this.fBillable.set(false);
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(e: TimeEntryResponse): void {
    this.modalMode.set('edit');
    this.editId.set(e.id);
    this.fDate.set(e.date);
    this.fStartTime.set(e.startTime ?? '');
    this.fEndTime.set(e.endTime ?? '');
    this.fDurationMinutes.set(e.durationMinutes?.toString() ?? '');
    this.fDescription.set(e.description ?? '');
    this.fProjectId.set(e.projectId ?? '');
    this.fBillable.set(e.billable);
    this.modalError.set('');
    this.showModal.set(true);
  }

  save(): void {
    if (!this.fDate()) {
      this.modalError.set('La fecha es obligatoria');
      return;
    }
    if (!this.fDurationMinutes() && (!this.fStartTime() || !this.fEndTime())) {
      this.modalError.set('Indica la duración o la hora de inicio y fin');
      return;
    }
    this.saving.set(true);
    this.modalError.set('');

    const body: CreateTimeEntryRequest = {
      date:            this.fDate(),
      startTime:       this.fStartTime() || undefined,
      endTime:         this.fEndTime() || undefined,
      durationMinutes: this.fDurationMinutes() ? +this.fDurationMinutes() : undefined,
      description:     this.fDescription() || undefined,
      projectId:       this.fProjectId() || undefined,
      billable:        this.fBillable(),
    };

    const req = this.modalMode() === 'create'
      ? this.svc.create(body)
      : this.svc.update(this.editId()!, body as UpdateTimeEntryRequest);

    req.subscribe({
      next:  () => { this.showModal.set(false); this.load(); this.saving.set(false); },
      error: () => { this.modalError.set('Error al guardar la entrada'); this.saving.set(false); },
    });
  }

  openDelete(e: TimeEntryResponse): void {
    this.deleteId.set(e.id);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    if (!this.deleteId()) return;
    this.deleting.set(true);
    this.svc.delete(this.deleteId()!).subscribe({
      next:  () => { this.showDeleteModal.set(false); this.load(); this.deleting.set(false); },
      error: () => this.deleting.set(false),
    });
  }
  formatDuration(minutes?: number): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  formatTime(t?: string): string {
    return t ? t.slice(0, 5) : '';
  }

  isToday(d: string): boolean {
    return d === new Date().toISOString().slice(0, 10);
  }

  pages(): number[] {
    return Array.from({ length: this.data()?.totalPages ?? 0 }, (_, i) => i);
  }

  getUserName(userId: string): string {
    if (userId === this.auth.userId()) {
      return 'Tú';
    }
    const userName = this.usersMap()[userId];
    if (userName) {
      return userName;
    }
    return 'Usuario';
  }
}
