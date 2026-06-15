import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ClientsService, Client, CreateClientRequest } from './clients.service';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    ModalComponent,
    SpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent implements OnInit, OnDestroy {
  private svc = inject(ClientsService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();
  clients      = signal<Client[]>([]);
  totalElements= signal(0);
  currentPage  = signal(0);
  totalPages   = signal(0);
  pageSize     = 20;
  loading      = signal(true);
  error        = signal('');
  searchQuery  = signal('');
  showModal    = signal(false);
  editingClient= signal<Client | null>(null);
  modalLoading = signal(false);
  modalError   = signal('');
  showDetail   = signal(false);
  detailClient = signal<Client | null>(null);
  showDeleteModal  = signal(false);
  deletingClient   = signal<Client | null>(null);
  deleteLoading    = signal(false);
  form = signal<CreateClientRequest>({
    name: '', email: '', phone: '', nif: '', legalName: '',
    address: '', city: '', postalCode: '', province: '', country: 'ES',
    contactPerson: '', contactEmail: '', contactPhone: '', notes: '',
  });
  readonly isEditing = computed(() => !!this.editingClient());
  readonly modalTitle = computed(() => this.isEditing() ? 'Editar cliente' : 'Nuevo cliente');

  ngOnInit(): void {
    this.loadClients();
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.currentPage.set(0);
      this.loadClients();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadClients(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.getAll(this.currentPage(), this.pageSize, this.searchQuery()).subscribe({
      next: page => {
        this.clients.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los clientes');
        this.loading.set(false);
      },
    });
  }

  onSearch(val: string): void {
    this.searchQuery.set(val);
    this.search$.next(val);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadClients();
  }
  openCreate(): void {
    this.editingClient.set(null);
    this.form.set({
      name: '', email: '', phone: '', nif: '', legalName: '',
      address: '', city: '', postalCode: '', province: '', country: 'ES',
      contactPerson: '', contactEmail: '', contactPhone: '', notes: '',
    });
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(client: Client): void {
    this.editingClient.set(client);
    this.form.set({
      name:          client.name,
      email:         client.email         ?? '',
      phone:         client.phone         ?? '',
      nif:           client.nif           ?? '',
      legalName:     client.legalName     ?? '',
      address:       client.address       ?? '',
      city:          client.city          ?? '',
      postalCode:    client.postalCode    ?? '',
      province:      client.province      ?? '',
      country:       client.country       ?? 'ES',
      contactPerson: client.contactPerson ?? '',
      contactEmail:  client.contactEmail  ?? '',
      contactPhone:  client.contactPhone  ?? '',
      notes:         client.notes         ?? '',
    });
    this.modalError.set('');
    this.showModal.set(true);
    this.showDetail.set(false);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingClient.set(null);
    this.modalError.set('');
  }
  save(): void {
    const f = this.form();
    if (!f.name?.trim()) { this.modalError.set('El nombre es obligatorio'); return; }

    this.modalLoading.set(true);
    this.modalError.set('');

    const payload: CreateClientRequest = {
      ...f,
      email:         f.email         || undefined,
      phone:         f.phone         || undefined,
      nif:           f.nif           || undefined,
      legalName:     f.legalName     || undefined,
      address:       f.address       || undefined,
      city:          f.city          || undefined,
      postalCode:    f.postalCode    || undefined,
      province:      f.province      || undefined,
      contactPerson: f.contactPerson || undefined,
      contactEmail:  f.contactEmail  || undefined,
      contactPhone:  f.contactPhone  || undefined,
      notes:         f.notes         || undefined,
    };

    const obs$ = this.isEditing()
      ? this.svc.update(this.editingClient()!.id, payload)
      : this.svc.create(payload);

    obs$.subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.closeModal();
        this.loadClients();
      },
      error: () => {
        this.modalLoading.set(false);
        this.modalError.set('Error al guardar el cliente. Revisa los datos.');
      },
    });
  }
  openDetail(client: Client): void {
    this.detailClient.set(client);
    this.showDetail.set(true);
  }

  closeDetail(): void {
    this.showDetail.set(false);
    this.detailClient.set(null);
  }
  openDelete(client: Client): void {
    this.deletingClient.set(client);
    this.showDeleteModal.set(true);
    this.showDetail.set(false);
  }

  closeDelete(): void {
    this.showDeleteModal.set(false);
    this.deletingClient.set(null);
  }

  confirmDelete(): void {
    const client = this.deletingClient();
    if (!client) return;
    this.deleteLoading.set(true);
    this.svc.delete(client.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.closeDelete();
        this.loadClients();
      },
      error: () => {
        this.deleteLoading.set(false);
      },
    });
  }
  patchForm(field: keyof CreateClientRequest, value: string): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get pages(): number[] {
    const total = this.totalPages();
    const cur   = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(0, cur - delta); i <= Math.min(total - 1, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }
}
