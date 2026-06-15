import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe, LowerCasePipe, DecimalPipe } from '@angular/common';
import { SettingsService } from '../../settings.service';
import { TeamMember, Role, RolePermission } from '../../../../core/models/user.model';
import { TeamsService } from '../../../teams/teams.service';
import { TeamResponse, TeamMemberResponse } from '../../../../core/models/team.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiService } from '../../../../core/services/api.service';

type SubTab = 'users' | 'roles' | 'teams' | 'series';

const ALL_MODULES = [
  { key: 'DASHBOARD', label: 'Dashboard' },
  { key: 'CLIENTS', label: 'Clientes' },
  { key: 'PROJECTS', label: 'Proyectos' },
  { key: 'TASKS', label: 'Tareas' },
  { key: 'TIME', label: 'Tiempo' },
  { key: 'INVOICES', label: 'Facturas' },
  { key: 'QUOTES', label: 'Presupuestos' },
  { key: 'EXPENSES', label: 'Gastos' },
  { key: 'SUPPLIERS', label: 'Proveedores' },
  { key: 'CATALOG', label: 'Catalogo' },
  { key: 'FISCAL', label: 'Fiscal' },
  { key: 'REPORTS', label: 'Informes' },
  { key: 'TEAM', label: 'Equipo' },
  { key: 'SETTINGS', label: 'Ajustes' },
  { key: 'BILLING', label: 'Facturacion' },
] as const;

type ModuleKey = typeof ALL_MODULES[number]['key'];

interface PermRow {
  module: ModuleKey;
  label: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface QuoteSeries {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
  defaultSeries: boolean;
  active: boolean;
}

@Component({
  selector: 'app-team-tab',
  standalone: true,
  imports: [
    CommonModule, DatePipe, ButtonComponent, InputComponent, SelectComponent, ModalComponent,
  ],
  templateUrl: './team-tab.component.html',
  styleUrl: './team-tab.component.css',
})
export class TeamTabComponent implements OnInit {
  private svc = inject(SettingsService);
  private authSvc = inject(AuthService);
  private teamsSvc = inject(TeamsService);
  private api = inject(ApiService);

  readonly currentUserId = computed(() => this.authSvc.userId());
  readonly isOwner = computed(() => this.authSvc.isOwner());
  readonly allModules = ALL_MODULES;

  subTab = signal<SubTab>('users');
  members = signal<TeamMember[]>([]);
  loadingMembers = signal(true);
  showUserModal = signal(false);
  newEmail = signal('');
  newFirst = signal('');
  newLast = signal('');
  newPassword = signal('');
  newRoleId = signal('');
  newJobTitle = signal('');
  savingUser = signal(false);
  userError = signal('');
  userSuccess = signal(false);
  openRoleMenuFor = signal<string | null>(null);
  roles = signal<Role[]>([]);
  loadingRoles = signal(true);
  showRoleModal = signal(false);
  editingRole = signal<Role | null>(null);
  roleName = signal('');
  roleDesc = signal('');
  savingRole = signal(false);
  roleError = signal('');
  roleSuccess = signal(false);
  permMatrix = signal<PermRow[]>([]);

  readonly roleOptions = computed(() => this.roles().map(r => ({ value: r.id, label: r.name })));
  teams = signal<TeamResponse[]>([]);
  loadingTeams = signal(false);
  selectedTeam = signal<TeamResponse | null>(null);
  teamMembers = signal<TeamMemberResponse[]>([]);
  loadingTeamMembers = signal(false);
  showTeamModal = signal(false);
  teamModalMode = signal<'create' | 'edit'>('create');
  teamName = signal('');
  teamDesc = signal('');
  savingTeam = signal(false);
  teamError = signal('');
  addingTeamMember = signal(false);
  selectedTeamMemberId = signal('');
  selectedTeamRole = signal<'LEADER' | 'MEMBER'>('MEMBER');

  readonly availableForTeam = computed(() => {
    const inTeam = new Set(this.teamMembers().map(m => m.userId));
    return this.members()
      .filter(u => !inTeam.has(u.id))
      .map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}`.trim() || u.email }));
  });

  readonly teamRoleOptions = [
    { value: 'MEMBER', label: 'Miembro' },
    { value: 'LEADER', label: 'Lider' },
  ];
  series = signal<QuoteSeries[]>([]);
  loadingSeries = signal(false);
  showSeriesModal = signal(false);
  seriesName = signal('');
  seriesPrefix = signal('');
  seriesNextNum = signal(1);
  savingSeries = signal(false);
  seriesError = signal('');
  seriesSuccess = signal(false);
  readonly seriesPreview = computed(() => {
    const prefix = this.seriesPrefix().trim().toUpperCase() || 'PRE';
    const n = String(this.seriesNextNum()).padStart(4, '0');
    return `${prefix}-${n}`;
  });
  moduleLabel(key: string): string {
    return key.toLowerCase();
  }

  ngOnInit(): void {
    this.loadMembers();
    this.loadRoles();
    this.loadTeams();
  }

  onSubTabChange(tab: SubTab): void {
    this.subTab.set(tab);
    if (tab === 'series' && this.series().length === 0) this.loadSeries();
  }
  isProtected(member: TeamMember): boolean {
    return member.roleName === 'OWNER' || member.id === this.currentUserId();
  }

  getMemberRoleId(member: TeamMember): string {
    if (member.roleId) return member.roleId;
    return this.roles().find(r => r.name === member.roleName)?.id ?? '';
  }

  getMemberRoleName(member: TeamMember): string {
    const id = this.getMemberRoleId(member);
    return this.roles().find(r => r.id === id)?.name ?? member.roleName ?? '—';
  }

  toggleRoleMenu(userId: string, event: Event): void {
    event.stopPropagation();
    this.openRoleMenuFor.set(this.openRoleMenuFor() === userId ? null : userId);
  }

  closeRoleMenu(): void { this.openRoleMenuFor.set(null); }

  selectRole(member: TeamMember, roleId: string): void {
    this.openRoleMenuFor.set(null);
    if (roleId === this.getMemberRoleId(member)) return;
    this.svc.changeUserRole(member.id, roleId).subscribe({
      next: updated => this.members.update(l => l.map(m => m.id === member.id ? updated : m)),
    });
  }

  loadMembers(): void {
    this.loadingMembers.set(true);
    this.svc.getTeam().subscribe({
      next: p => { this.members.set(p.content); this.loadingMembers.set(false); },
      error: () => this.loadingMembers.set(false),
    });
  }

  openUserModal(): void {
    this.newEmail.set(''); this.newFirst.set(''); this.newLast.set('');
    this.newPassword.set(''); this.newJobTitle.set(''); this.userError.set('');
    const first = this.roles().find(r => !r.isSystem) ?? this.roles()[0];
    if (first) this.newRoleId.set(first.id);
    this.showUserModal.set(true);
  }

  closeUserModal(): void { this.showUserModal.set(false); this.userError.set(''); }

  createUser(): void {
    this.userError.set('');
    if (!this.newEmail() || !this.newPassword() || !this.newRoleId()) {
      this.userError.set('Email, contrasena y rol son obligatorios'); return;
    }
    this.savingUser.set(true);
    this.svc.createUser({
      email: this.newEmail(), password: this.newPassword(),
      firstName: this.newFirst(), lastName: this.newLast(),
      jobTitle: this.newJobTitle(), roleId: this.newRoleId(),
    }).subscribe({
      next: user => {
        this.members.update(l => [user, ...l]);
        this.showUserModal.set(false); this.savingUser.set(false);
        this.userSuccess.set(true); setTimeout(() => this.userSuccess.set(false), 3000);
      },
      error: () => { this.savingUser.set(false); this.userError.set('Error al crear el usuario. Comprueba que el email no este en uso.'); },
    });
  }

  deactivateUser(id: string): void { this.svc.deactivateUser(id).subscribe({ next: u => this.members.update(l => l.map(m => m.id === id ? u : m)) }); }
  activateUser(id: string): void { this.svc.activateUser(id).subscribe({ next: u => this.members.update(l => l.map(m => m.id === id ? u : m)) }); }
  deleteUser(id: string): void { this.svc.deleteUser(id).subscribe({ next: () => this.members.update(l => l.filter(m => m.id !== id)) }); }
  private buildEmptyMatrix(): PermRow[] {
    return ALL_MODULES.map(m => ({
      module: m.key, label: m.label,
      canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false,
    }));
  }

  loadRoles(): void {
    this.loadingRoles.set(true);
    this.svc.getRoles().subscribe({
      next: roles => {
        this.roles.set(roles);
        const first = roles.find(r => !r.isSystem) ?? roles[0];
        if (first) this.newRoleId.set(first.id);
        this.loadingRoles.set(false);
      },
      error: () => this.loadingRoles.set(false),
    });
  }

  openRoleCreate(): void {
    this.editingRole.set(null);
    this.roleName.set(''); this.roleDesc.set(''); this.roleError.set('');
    this.permMatrix.set(this.buildEmptyMatrix());
    this.showRoleModal.set(true);
  }

  openRoleEdit(role: Role): void {
    if (role.isSystem) return;
    this.editingRole.set(role);
    this.roleName.set(role.name);
    this.roleDesc.set(role.description ?? '');
    this.roleError.set('');
    const perms: RolePermission[] = role.permissions ?? [];
    this.permMatrix.set(ALL_MODULES.map(m => {
      const p = perms.find(x => x.module === m.key);
      return {
        module: m.key, label: m.label,
        canView: p?.canView ?? false,
        canCreate: p?.canCreate ?? false,
        canEdit: p?.canEdit ?? false,
        canDelete: p?.canDelete ?? false,
        canExport: p?.canExport ?? false,
      };
    }));
    this.showRoleModal.set(true);
  }

  closeRoleModal(): void { this.showRoleModal.set(false); this.roleError.set(''); }

  togglePerm(moduleKey: ModuleKey, perm: keyof Omit<PermRow, 'module' | 'label'>): void {
    this.permMatrix.update(rows => rows.map(r => {
      if (r.module !== moduleKey) return r;
      const newVal = !r[perm];
      const updated = { ...r, [perm]: newVal };
      if (perm !== 'canView' && newVal && !updated.canView) updated.canView = true;
      return updated;
    }));
  }

  toggleRowAll(moduleKey: ModuleKey): void {
    this.permMatrix.update(rows => rows.map(r => {
      if (r.module !== moduleKey) return r;
      const allOn = r.canView && r.canCreate && r.canEdit && r.canDelete && r.canExport;
      return { ...r, canView: !allOn, canCreate: !allOn, canEdit: !allOn, canDelete: !allOn, canExport: !allOn };
    }));
  }

  hasAnyPerm(r: PermRow): boolean { return r.canView || r.canCreate || r.canEdit || r.canDelete || r.canExport; }
  isAllRow(r: PermRow): boolean { return r.canView && r.canCreate && r.canEdit && r.canDelete && r.canExport; }

  saveRole(): void {
    this.roleError.set('');

    if (!this.roleName().trim()) {
      this.roleError.set('El nombre es obligatorio');
      return;
    }

    let active = this.permMatrix().filter(r => this.hasAnyPerm(r));
    if (!active.length) {
      this.roleError.set('Asigna al menos un permiso');
      return;
    }

    const unique = new Map<ModuleKey, PermRow>();
    for (const row of active) {
      unique.set(row.module, row);
    }

    const payload = {
      name: this.roleName().trim(),
      description: this.roleDesc() || undefined,
      defaultRole: this.editingRole()?.defaultRole ?? false,
      permissions: Array.from(unique.values()).map(r => ({
        module: r.module,
        canView: r.canView,
        canCreate: r.canCreate,
        canEdit: r.canEdit,
        canDelete: r.canDelete,
        canExport: r.canExport,
      })),
    };

    this.savingRole.set(true);
    const editing = this.editingRole();

    const obs$ = editing
      ? this.svc.updateRole(editing.id, payload)
      : this.svc.createRole(payload);

    obs$.subscribe({
      next: () => {
        this.loadRoles();

        this.showRoleModal.set(false);
        this.savingRole.set(false);
        this.roleSuccess.set(true);
        setTimeout(() => this.roleSuccess.set(false), 3000);
      },
      error: (err) => {
        this.savingRole.set(false);
        console.error('Error backend:', err);
        this.roleError.set('Error al guardar el rol');
      },
    });
  }

  deleteRole(id: string): void { this.svc.deleteRole(id).subscribe({ next: () => this.roles.update(l => l.filter(r => r.id !== id)) }); }
  loadTeams(): void {
    this.loadingTeams.set(true);
    this.teamsSvc.list().subscribe({
      next: p => { this.teams.set(p.content); this.loadingTeams.set(false); },
      error: () => this.loadingTeams.set(false),
    });
  }

  selectTeam(team: TeamResponse): void {
    this.selectedTeam.set(team);
    this.loadingTeamMembers.set(true);
    this.selectedTeamMemberId.set('');
    this.teamsSvc.getMembers(team.id).subscribe({
      next: m => { this.teamMembers.set(m); this.loadingTeamMembers.set(false); },
      error: () => this.loadingTeamMembers.set(false),
    });
  }

  openTeamCreate(): void {
    this.teamModalMode.set('create');
    this.teamName.set(''); this.teamDesc.set(''); this.teamError.set('');
    this.showTeamModal.set(true);
  }

  openTeamEdit(t: TeamResponse): void {
    this.teamModalMode.set('edit');
    this.teamName.set(t.name); this.teamDesc.set(t.description ?? ''); this.teamError.set('');
    this.showTeamModal.set(true);
  }

  closeTeamModal(): void { this.showTeamModal.set(false); this.teamError.set(''); }

  saveTeam(): void {
    if (!this.teamName().trim()) { this.teamError.set('El nombre es obligatorio'); return; }
    this.savingTeam.set(true); this.teamError.set('');
    if (this.teamModalMode() === 'create') {
      this.teamsSvc.create({ name: this.teamName().trim(), description: this.teamDesc() || undefined }).subscribe({
        next: t => { this.teams.update(l => [...l, t]); this.closeTeamModal(); this.savingTeam.set(false); },
        error: () => { this.teamError.set('Error al guardar'); this.savingTeam.set(false); },
      });
    } else {
      const id = this.selectedTeam()!.id;
      this.teamsSvc.update(id, { name: this.teamName().trim(), description: this.teamDesc() || undefined }).subscribe({
        next: t => {
          this.teams.update(l => l.map(x => x.id === id ? t : x));
          this.selectedTeam.set(t);
          this.closeTeamModal(); this.savingTeam.set(false);
        },
        error: () => { this.teamError.set('Error al guardar'); this.savingTeam.set(false); },
      });
    }
  }

  deleteTeam(id: string): void {
    this.teamsSvc.delete(id).subscribe({
      next: () => {
        this.teams.update(l => l.filter(t => t.id !== id));
        if (this.selectedTeam()?.id === id) this.selectedTeam.set(null);
      },
    });
  }

  addTeamMember(): void {
    const userId = this.selectedTeamMemberId(), teamId = this.selectedTeam()?.id;
    if (!userId || !teamId) return;
    this.addingTeamMember.set(true);
    this.teamsSvc.addMember(teamId, { userId, role: this.selectedTeamRole() }).subscribe({
      next: m => {
        this.teamMembers.update(l => [...l, m]);
        this.selectedTeamMemberId.set('');
        this.selectedTeamRole.set('MEMBER');
        this.addingTeamMember.set(false);
      },
      error: () => this.addingTeamMember.set(false),
    });
  }

  removeTeamMember(userId: string): void {
    const teamId = this.selectedTeam()?.id;
    if (!teamId) return;
    this.teamsSvc.removeMember(teamId, userId).subscribe({
      next: () => this.teamMembers.update(l => l.filter(m => m.userId !== userId)),
    });
  }

  getTeamMemberInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
  loadSeries(): void {
    this.loadingSeries.set(true);
    this.api.get<QuoteSeries[]>('/quote-series').subscribe({
      next: s => { this.series.set(s); this.loadingSeries.set(false); },
      error: () => this.loadingSeries.set(false),
    });
  }

  openSeriesCreate(): void {
    this.seriesName.set(''); this.seriesPrefix.set(''); this.seriesNextNum.set(1);
    this.seriesError.set(''); this.showSeriesModal.set(true);
  }

  closeSeriesModal(): void { this.showSeriesModal.set(false); this.seriesError.set(''); }

  saveSeries(): void {
    if (!this.seriesName().trim() || !this.seriesPrefix().trim()) {
      this.seriesError.set('Nombre y prefijo son obligatorios'); return;
    }
    this.savingSeries.set(true);
    const payload = {
      name: this.seriesName().trim(),
      prefix: this.seriesPrefix().trim().toUpperCase(),
      nextNumber: +this.seriesNextNum(),
    };
    this.api.post<QuoteSeries>('/quote-series', payload).subscribe({
      next: s => {
        this.series.update(l => [...l, s]);
        this.showSeriesModal.set(false); this.savingSeries.set(false);
        this.seriesSuccess.set(true); setTimeout(() => this.seriesSuccess.set(false), 3000);
      },
      error: () => { this.savingSeries.set(false); this.seriesError.set('Error al guardar la serie'); },
    });
  }

  setDefaultSeries(id: string): void {
    this.api.patch<QuoteSeries>(`/quote-series/${id}/default`, {}).subscribe({ next: () => this.loadSeries() });
  }

  deleteSeries(id: string): void {
    this.api.delete(`/quote-series/${id}`).subscribe({
      next: () => this.series.update(l => l.filter(s => s.id !== id)),
    });
  }
}
