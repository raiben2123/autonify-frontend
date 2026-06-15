import {
  Component, inject, signal, computed, OnInit, OnDestroy, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksService } from './tasks.service';
import { ProjectsService } from '../projects/projects.service';
import { TeamsService } from '../teams/teams.service';
import { SettingsService } from '../settings/settings.service';
import { PermissionService } from '../../core/auth/permission.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { TextareaComponent } from '../../shared/components/textarea/textarea.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import {
  TaskResponse, TaskStatus, TaskPriority,
  CreateTaskRequest, UpdateTaskRequest,
  TaskAssigneeResponse, KANBAN_COLUMNS,
} from '../../core/models/task.model';
import { ProjectResponse } from '../../core/models/project.model';
import { TeamMember } from '../../core/models/user.model';
import { Subject, forkJoin, takeUntil } from 'rxjs';

export type ViewMode = 'kanban' | 'list' | 'gantt';

interface KanbanColumn {
  status: TaskStatus;
  label: string;
  tasks: TaskResponse[];
  dragOver: boolean;
}

interface GanttRow {
  task: TaskResponse;
  startPx: number;
  widthPx: number;
  color: string;
}
type GanttDragHandle = 'start' | 'end' | 'bar';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent, ButtonComponent,
    InputComponent, SelectComponent, TextareaComponent,
    ModalComponent, SpinnerComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit, OnDestroy {
  private svc         = inject(TasksService);
  private projectsSvc = inject(ProjectsService);
  private settingsSvc = inject(SettingsService);
  readonly perms      = inject(PermissionService);
  private destroy$    = new Subject<void>();
  viewMode = signal<ViewMode>('kanban');
  loading         = signal(true);
  error           = signal('');
  selectedProject = signal<string>('');
  projects    = signal<ProjectResponse[]>([]);
  allUsers    = signal<TeamMember[]>([]);
  allTasks    = signal<TaskResponse[]>([]);
  columns = signal<KanbanColumn[]>(
    KANBAN_COLUMNS.map(c => ({ ...c, tasks: [], dragOver: false }))
  );
  draggedTask = signal<TaskResponse | null>(null);
  ganttStartDate  = signal<Date>(new Date());
  ganttDays       = signal(60);
  readonly DAY_PX = 28;
  private ganttDragTask$    = signal<TaskResponse | null>(null);
  private ganttDragHandle$  = signal<GanttDragHandle>('bar');
  private ganttDragStartX   = 0;
  private ganttDragOrigStart = '';
  private ganttDragOrigEnd   = '';
  private ganttWasDragging   = false;  // ← evita abrir modal si hubo drag
  showModal  = signal(false);
  modalMode  = signal<'create' | 'edit'>('create');
  editTask   = signal<TaskResponse | null>(null);
  saving     = signal(false);
  modalError = signal('');

  fProjectId        = signal('');
  fTitle            = signal('');
  fDescription      = signal('');
  fPriority         = signal<TaskPriority>('MEDIUM');
  fStatus           = signal<TaskStatus>('TODO');
  fStartDate        = signal('');
  fDueDate          = signal('');
  fEstimatedMinutes = signal('');
  showDetailModal  = signal(false);
  detailTask       = signal<TaskResponse | null>(null);
  detailAssignees  = signal<TaskAssigneeResponse[]>([]);
  loadingAssignees = signal(false);
  addingAssignee   = signal(false);
  selectedAssignee = signal('');
  showDeleteModal = signal(false);
  deleteId        = signal<string | null>(null);
  deleteTitle     = signal('');
  deleting        = signal(false);
  canCreate = computed(() => this.perms.canAccess('tasks'));
  canEdit   = computed(() => this.perms.canAccess('tasks'));
  canDelete = computed(() => this.perms.isOwner || this.perms.isAdmin);
  canAdmin  = computed(() => this.perms.isOwner || this.perms.isAdmin);

  projectFormOptions = computed(() =>
    this.projects().map(p => ({ value: p.id, label: p.name }))
  );

  availableAssigneeOptions = computed(() => {
    const assigned = new Set(this.detailAssignees().map(a => a.userId));
    return this.allUsers()
      .filter(u => !assigned.has(u.id))
      .map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }));
  });

  priorityOptions = [
    { value: 'LOW',    label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH',   label: 'Alta' },
    { value: 'URGENT', label: 'Urgente' },
  ];

  statusOptions = KANBAN_COLUMNS.map(c => ({ value: c.status, label: c.label }));

  totalTasks = computed(() => this.allTasks().length);

  filteredTasks = computed(() => {
    const pid = this.selectedProject();
    return pid ? this.allTasks().filter(t => t.projectId === pid) : this.allTasks();
  });

  ganttRows = computed((): GanttRow[] => {
    const tasks  = this.filteredTasks().filter(t => t.dueDate);
    const origin = this.ganttStartDate();
    const dayPx  = this.DAY_PX;

    return tasks.map(task => {
      const rawStart = task.startDate
        ? new Date(task.startDate)
        : new Date(task.createdAt);
      const rawEnd   = new Date(task.dueDate!);
      rawStart.setHours(0,0,0,0);
      rawEnd.setHours(0,0,0,0);

      const startDay = Math.floor((rawStart.getTime() - origin.getTime()) / 86400000);
      const endDay   = Math.floor((rawEnd.getTime()   - origin.getTime()) / 86400000);

      const clampedStart = Math.max(0, startDay);
      const clampedEnd   = Math.max(clampedStart, endDay);

      return {
        task,
        startPx: clampedStart * dayPx,
        widthPx: Math.max(dayPx, (clampedEnd - clampedStart + 1) * dayPx),
        color:   this.priorityColor(task.priority),
      };
    }).sort((a, b) => a.startPx - b.startPx);
  });

  ganttHeaders = computed(() => {
    const start = this.ganttStartDate();
    const days  = this.ganttDays();
    const today = new Date(); today.setHours(0,0,0,0);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const isMonth = d.getDate() === 1;
      const isToday = d.toDateString() === today.toDateString();
      return {
        label: isMonth
          ? d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
          : String(d.getDate()),
        col: i, isMonth, isToday,
      };
    });
  });

  ganttTotalWidth = computed(() => this.ganttDays() * this.DAY_PX);

  todayOffset = computed(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.floor((today.getTime() - this.ganttStartDate().getTime()) / 86400000);
    return diff >= 0 && diff < this.ganttDays() ? diff * this.DAY_PX : -1;
  });
  ngOnInit(): void {
    const s = new Date(); s.setDate(s.getDate() - 14); s.setHours(0,0,0,0);
    this.ganttStartDate.set(s);

    forkJoin([
      this.projectsSvc.list(0, 100),
      this.settingsSvc.getTeam(0, 100),
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([projects, users]) => {
        this.projects.set(projects.content);
        this.allUsers.set(users.content as TeamMember[]);
        if (projects.content.length > 0) {
          this.selectedProject.set(projects.content[0].id);
        }
        this.loadTasks();
      },
      error: () => { this.error.set('Error al cargar datos'); this.loading.set(false); },
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
  onProjectChange(id: string): void {
    this.selectedProject.set(id);
    this.rebuildColumns();
  }
  loadTasks(): void {
    this.loading.set(true);
    this.svc.list(0, 500).pipe(takeUntil(this.destroy$)).subscribe({
      next: page => {
        this.allTasks.set(page.content);
        this.rebuildColumns();
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar tareas'); this.loading.set(false); },
    });
  }

  rebuildColumns(): void {
    const tasks = this.filteredTasks();
    this.columns.set(
      KANBAN_COLUMNS.map(c => ({
        ...c,
        dragOver: false,
        tasks: tasks.filter(t => t.status === c.status),
      }))
    );
  }
  onDragStart(event: DragEvent, task: TaskResponse): void {
    this.draggedTask.set(task);
    event.dataTransfer?.setData('text/plain', task.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    (event.currentTarget as HTMLElement).classList.add('dragging');
  }

  onDragEnd(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('dragging');
    this.columns.update(cols => cols.map(c => ({ ...c, dragOver: false })));
    this.draggedTask.set(null);
  }

  onDragOver(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.columns.update(cols =>
      cols.map(c => ({ ...c, dragOver: c.status === status }))
    );
  }

  onDragLeave(status: TaskStatus): void {
    this.columns.update(cols =>
      cols.map(c => c.status === status ? { ...c, dragOver: false } : c)
    );
  }

  onDrop(event: DragEvent, newStatus: TaskStatus): void {
    event.preventDefault();
    this.columns.update(cols => cols.map(c => ({ ...c, dragOver: false })));
    const task = this.draggedTask();
    this.draggedTask.set(null);
    if (!task || task.status === newStatus) return;
    const updatedTask = { ...task, status: newStatus };
    this.allTasks.update(list => list.map(t => t.id === task.id ? updatedTask : t));
    this.rebuildColumns();
    this.svc.update(task.id, { status: newStatus }).pipe(takeUntil(this.destroy$)).subscribe({
      next: result => {
        this.allTasks.update(list => list.map(t => t.id === result.id ? result : t));
        this.rebuildColumns();
      },
      error: () => {
        this.allTasks.update(list => list.map(t => t.id === task.id ? task : t));
        this.rebuildColumns();
      },
    });
  }
  ganttMouseDown(event: MouseEvent, task: TaskResponse, handle: GanttDragHandle): void {
    event.preventDefault();
    event.stopPropagation();
    this.ganttDragTask$.set(task);
    this.ganttDragHandle$.set(handle);
    this.ganttDragStartX  = event.clientX;
    this.ganttDragOrigStart = task.startDate ?? task.createdAt.slice(0, 10);
    this.ganttDragOrigEnd   = task.dueDate ?? '';
    this.ganttWasDragging   = false;

    const onMove = (e: MouseEvent) => this.ganttMove(e);
    const onUp   = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.ganttUp();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private ganttMove(event: MouseEvent): void {
    const task   = this.ganttDragTask$();
    if (!task) return;
    const deltaPx   = event.clientX - this.ganttDragStartX;
    const deltaDays = Math.round(deltaPx / this.DAY_PX);
    if (deltaDays === 0) return;
    this.ganttWasDragging = true;

    const handle = this.ganttDragHandle$();
    let newStart = this.ganttDragOrigStart;
    let newEnd   = this.ganttDragOrigEnd;

    if (handle === 'start' || handle === 'bar') {
      const d = new Date(this.ganttDragOrigStart);
      d.setDate(d.getDate() + deltaDays);
      newStart = d.toISOString().slice(0, 10);
    }
    if (handle === 'end' || handle === 'bar') {
      if (this.ganttDragOrigEnd) {
        const d = new Date(this.ganttDragOrigEnd);
        d.setDate(d.getDate() + deltaDays);
        newEnd = d.toISOString().slice(0, 10);
      }
    }
    if (newStart && newEnd && newStart > newEnd) return;

    this.allTasks.update(list =>
      list.map(t => t.id === task.id
        ? { ...t, startDate: newStart, dueDate: newEnd || t.dueDate }
        : t
      )
    );
  }

  private ganttUp(): void {
    const task = this.ganttDragTask$();
    this.ganttDragTask$.set(null);
    if (!task || !this.ganttWasDragging) return;

    const current = this.allTasks().find(t => t.id === task.id);
    if (!current) return;

    const body: UpdateTaskRequest = {};
    if (current.startDate !== this.ganttDragOrigStart) body.startDate = current.startDate;
    if (current.dueDate   !== this.ganttDragOrigEnd)   body.dueDate   = current.dueDate;

    if (Object.keys(body).length === 0) return;

    this.svc.update(task.id, body).pipe(takeUntil(this.destroy$)).subscribe({
      next: result => this.allTasks.update(l => l.map(t => t.id === result.id ? result : t)),
      error: () => {
        this.allTasks.update(l =>
          l.map(t => t.id === task.id
            ? { ...t, startDate: this.ganttDragOrigStart, dueDate: this.ganttDragOrigEnd }
            : t
          )
        );
      },
    });
  }
  ganttBarClick(task: TaskResponse): void {
    if (this.ganttWasDragging) { this.ganttWasDragging = false; return; }
    this.openDetail(task);
  }
  setView(v: ViewMode): void { this.viewMode.set(v); }
  openCreate(defaultStatus: TaskStatus = 'TODO'): void {
    this.modalMode.set('create');
    this.editTask.set(null);
    this.fProjectId.set(this.selectedProject() || this.projects()[0]?.id || '');
    this.fTitle.set(''); this.fDescription.set('');
    this.fPriority.set('MEDIUM'); this.fStatus.set(defaultStatus);
    this.fStartDate.set(''); this.fDueDate.set('');
    this.fEstimatedMinutes.set('');
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(task: TaskResponse): void {
    this.modalMode.set('edit');
    this.editTask.set(task);
    this.fProjectId.set(task.projectId);
    this.fTitle.set(task.title);
    this.fDescription.set(task.description ?? '');
    this.fPriority.set(task.priority);
    this.fStatus.set(task.status);
    this.fStartDate.set(task.startDate ?? '');
    this.fDueDate.set(task.dueDate ?? '');
    this.fEstimatedMinutes.set(task.estimatedMinutes?.toString() ?? '');
    this.modalError.set('');
    this.showModal.set(true);
  }

  save(): void {
    if (!this.fTitle().trim()) { this.modalError.set('El título es obligatorio'); return; }
    if (!this.fProjectId())   { this.modalError.set('Selecciona un proyecto'); return; }
    this.saving.set(true); this.modalError.set('');

    const isCreate = this.modalMode() === 'create';

    if (isCreate) {
      const body: CreateTaskRequest = {
        projectId:        this.fProjectId(),
        title:            this.fTitle().trim(),
        description:      this.fDescription() || undefined,
        priority:         this.fPriority(),
        startDate:        this.fStartDate() || undefined,
        dueDate:          this.fDueDate()   || undefined,
        estimatedMinutes: this.fEstimatedMinutes() ? +this.fEstimatedMinutes() : undefined,
      };
      this.svc.create(body).pipe(takeUntil(this.destroy$)).subscribe({
        next: result => {
          this.saving.set(false); this.showModal.set(false);
          this.allTasks.update(l => [...l, result]);
          this.rebuildColumns();
        },
        error: () => { this.modalError.set('Error al guardar'); this.saving.set(false); },
      });
    } else {
      const body: UpdateTaskRequest = {
        title:            this.fTitle().trim(),
        description:      this.fDescription() || undefined,
        priority:         this.fPriority(),
        status:           this.fStatus(),
        startDate:        this.fStartDate() || undefined,
        dueDate:          this.fDueDate()   || undefined,
        estimatedMinutes: this.fEstimatedMinutes() ? +this.fEstimatedMinutes() : undefined,
      };
      this.svc.update(this.editTask()!.id, body).pipe(takeUntil(this.destroy$)).subscribe({
        next: result => {
          this.saving.set(false); this.showModal.set(false);
          this.allTasks.update(l => l.map(t => t.id === result.id ? result : t));
          this.rebuildColumns();
        },
        error: () => { this.modalError.set('Error al guardar'); this.saving.set(false); },
      });
    }
  }
  openDetail(task: TaskResponse): void {
    this.detailTask.set(task);
    this.detailAssignees.set([]);
    this.selectedAssignee.set('');
    this.showDetailModal.set(true);
    this.loadingAssignees.set(true);
    this.svc.getAssignees(task.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: a => { this.detailAssignees.set(a); this.loadingAssignees.set(false); },
      error: () => this.loadingAssignees.set(false),
    });
  }

  addAssignee(): void {
    const userId = this.selectedAssignee();
    const taskId = this.detailTask()?.id;
    if (!userId || !taskId) return;
    this.addingAssignee.set(true);
    this.svc.addAssignee(taskId, { userId }).pipe(takeUntil(this.destroy$)).subscribe({
      next: a => {
        this.detailAssignees.update(l => [...l, a]);
        this.selectedAssignee.set('');
        this.addingAssignee.set(false);
      },
      error: () => this.addingAssignee.set(false),
    });
  }

  removeAssignee(a: TaskAssigneeResponse): void {
    const taskId = this.detailTask()?.id;
    if (!taskId) return;
    this.svc.removeAssignee(taskId, a.userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.detailAssignees.update(l => l.filter(x => x.id !== a.id)),
    });
  }
  openDelete(task: TaskResponse, event?: Event): void {
    event?.stopPropagation();
    this.deleteId.set(task.id);
    this.deleteTitle.set(task.title);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    if (!this.deleteId()) return;
    this.deleting.set(true);
    const id = this.deleteId()!;
    this.svc.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.allTasks.update(l => l.filter(t => t.id !== id));
        this.rebuildColumns();
        this.showDeleteModal.set(false);
        this.showDetailModal.set(false);
        this.deleting.set(false);
      },
      error: () => this.deleting.set(false),
    });
  }
  changeStatus(task: TaskResponse, newStatus: TaskStatus): void {
    if (task.status === newStatus) return;
    const optimistic = { ...task, status: newStatus };
    this.allTasks.update(l => l.map(t => t.id === task.id ? optimistic : t));
    this.detailTask.set(optimistic);
    this.rebuildColumns();
    this.svc.update(task.id, { status: newStatus }).pipe(takeUntil(this.destroy$)).subscribe({
      next: result => { this.allTasks.update(l => l.map(t => t.id === result.id ? result : t)); this.rebuildColumns(); },
      error: () => { this.allTasks.update(l => l.map(t => t.id === task.id ? task : t)); this.rebuildColumns(); },
    });
  }
  setPriority(v: string): void { this.fPriority.set(v as TaskPriority); }
  setStatus(v: string): void   { this.fStatus.set(v as TaskStatus); }

  priorityLabel(p: TaskPriority): string {
    return { LOW:'Baja', MEDIUM:'Media', HIGH:'Alta', URGENT:'Urgente' }[p];
  }
  priorityClass(p: TaskPriority): string {
    return { LOW:'priority--low', MEDIUM:'priority--medium', HIGH:'priority--high', URGENT:'priority--urgent' }[p];
  }
  priorityColor(p: TaskPriority): string {
    return { LOW:'#94a3b8', MEDIUM:'#f59e0b', HIGH:'#f97316', URGENT:'#ef4444' }[p];
  }
  columnHeaderClass(s: TaskStatus): string {
    return { TODO:'col-header--todo', IN_PROGRESS:'col-header--progress', REVIEW:'col-header--review', DONE:'col-header--done', CANCELLED:'col-header--cancelled' }[s];
  }
  statusLabel(s: TaskStatus): string {
    return { TODO:'Por hacer', IN_PROGRESS:'En progreso', REVIEW:'En revisión', DONE:'Hecho', CANCELLED:'Cancelado' }[s];
  }
  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short' });
  }
  formatDateFull(d: string): string {
    return new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
  }
  isOverdue(t: TaskResponse): boolean {
    if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false;
    return new Date(t.dueDate) < new Date();
  }
  formatDuration(min?: number): string {
    if (!min) return '';
    const h = Math.floor(min / 60), m = min % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  initials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
  columnsForSelect(current: TaskStatus) {
    return KANBAN_COLUMNS.filter(c => c.status !== current);
  }
  isDraggingGantt(): boolean {
    return !!this.ganttDragTask$();
  }
}
