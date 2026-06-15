import {
  Component, inject, signal, computed, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { QuotesService } from './quotes.service';
import { QuoteResponse, QuoteStatus, QuoteLineRequest, CreateQuoteRequest, QuoteSeriesResponse } from '../../core/models/quote.model';
import { ClientResponse } from '../../core/models/client.model';
import { CatalogItemResponse } from '../../core/models/catalog-item.model';
import { CatalogItemService } from '../catalog/catalog.service';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface LineForm {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: number;
}

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    ModalComponent,
    SpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.css',
})
export class QuotesComponent implements OnInit, OnDestroy {
  private svc        = inject(QuotesService);
  private catalogSvc = inject(CatalogItemService);
  private destroy$   = new Subject<void>();
  private search$    = new Subject<string>();
  quotes        = signal<QuoteResponse[]>([]);
  totalElements = signal(0);
  currentPage   = signal(0);
  totalPages    = signal(0);
  pageSize      = 20;
  loading       = signal(true);
  error         = signal('');
  searchQuery   = signal('');
  statusFilter  = signal<QuoteStatus | ''>('');
  showModal    = signal(false);
  editingQuote = signal<QuoteResponse | null>(null);
  modalLoading = signal(false);
  modalError   = signal('');
  showDetail    = signal(false);
  detailQuote   = signal<QuoteResponse | null>(null);
  detailLoading = signal(false);
  showDeleteModal = signal(false);
  deletingQuote   = signal<QuoteResponse | null>(null);
  deleteLoading   = signal(false);
  showRejectModal = signal(false);
  rejectingQuote  = signal<QuoteResponse | null>(null);
  rejectReason    = signal('');
  rejectLoading   = signal(false);
  showCatalogModal   = signal(false);
  catalogItems       = signal<CatalogItemResponse[]>([]);
  catalogLoading     = signal(false);
  catalogSearch      = signal('');
  private catalog$   = new Subject<string>();
  clients = signal<ClientResponse[]>([]);
  series  = signal<QuoteSeriesResponse[]>([]);
  form = signal<{
    clientId: string; seriesId: string;
    issueDate: string; validUntil: string;
    title: string; notes: string; terms: string;
  }>({ clientId: '', seriesId: '', issueDate: '', validUntil: '', title: '', notes: '', terms: '' });

  lines = signal<LineForm[]>([]);
  readonly isEditing  = computed(() => !!this.editingQuote());
  readonly modalTitle = computed(() => this.isEditing() ? 'Editar presupuesto' : 'Nuevo presupuesto');

  readonly lineSubtotals = computed(() =>
    this.lines().map(l => {
      const base = l.quantity * l.unitPrice * (1 - (l.discountPercentage || 0) / 100);
      const tax  = base * (l.taxRate / 100);
      return { subtotal: base, tax, total: base + tax };
    })
  );

  readonly formTotals = computed(() => {
    const subs = this.lineSubtotals();
    const subtotal  = subs.reduce((a, b) => a + b.subtotal, 0);
    const taxAmount = subs.reduce((a, b) => a + b.tax,      0);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  });

  readonly statusOptions: { value: QuoteStatus | ''; label: string }[] = [
    { value: '',          label: 'Todos'      },
    { value: 'DRAFT',     label: 'Borrador'   },
    { value: 'SENT',      label: 'Enviado'    },
    { value: 'VIEWED',    label: 'Visto'      },
    { value: 'APPROVED',  label: 'Aprobado'   },
    { value: 'REJECTED',  label: 'Rechazado'  },
    { value: 'EXPIRED',   label: 'Expirado'   },
    { value: 'CONVERTED', label: 'Convertido' },
  ];

  readonly taxRates = [0, 4, 10, 21];

  ngOnInit(): void {
    this.loadQuotes();
    this.loadAuxiliary();
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage.set(0); this.loadQuotes(); });
    this.catalog$.pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.loadCatalogItems(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadQuotes(): void {
    this.loading.set(true);
    this.error.set('');
    const query  = this.searchQuery().trim();
    const status = this.statusFilter() || undefined;
    const obs$ = query
      ? this.svc.search(query, this.currentPage(), this.pageSize)
      : status
        ? this.svc.getByStatus(status, this.currentPage(), this.pageSize)
        : this.svc.getAll(this.currentPage(), this.pageSize);
    obs$.subscribe({
      next: page => {
        this.quotes.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar los presupuestos'); this.loading.set(false); },
    });
  }

  loadAuxiliary(): void {
    this.svc.getClients().subscribe({ next: (p: { content: ClientResponse[] }) => this.clients.set(p.content) });
    this.svc.getSeries().subscribe({ next: s => this.series.set(s) });
  }

  onSearch(val: string): void { this.searchQuery.set(val); this.search$.next(val); }

  onStatusFilter(val: string): void {
    this.statusFilter.set(val as QuoteStatus | '');
    this.currentPage.set(0);
    this.loadQuotes();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadQuotes();
  }
  openCreate(): void {
    this.editingQuote.set(null);
    const today     = new Date().toISOString().split('T')[0];
    const inThirty  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const defSeries = this.series().find(s => s.isDefault)?.id ?? this.series()[0]?.id ?? '';
    this.form.set({ clientId: '', seriesId: defSeries, issueDate: today, validUntil: inThirty, title: '', notes: '', terms: '' });
    this.lines.set([this.emptyLine()]);
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(quote: QuoteResponse): void {
    this.editingQuote.set(quote);
    this.form.set({
      clientId: quote.clientId, seriesId: quote.seriesId,
      issueDate: quote.issueDate, validUntil: quote.validUntil,
      title: quote.title ?? '', notes: quote.notes ?? '', terms: quote.terms ?? '',
    });
    this.lines.set(
      (quote.lines ?? []).map(l => ({
        description: l.description, quantity: l.quantity,
        unitPrice: l.unitPrice, discountPercentage: l.discountPercentage ?? 0, taxRate: l.taxRate,
      }))
    );
    if (this.lines().length === 0) this.lines.set([this.emptyLine()]);
    this.modalError.set('');
    this.showModal.set(true);
    this.showDetail.set(false);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingQuote.set(null);
    this.modalError.set('');
  }
  emptyLine(): LineForm {
    return { description: '', quantity: 1, unitPrice: 0, discountPercentage: 0, taxRate: 21 };
  }

  addLine(): void {
    this.lines.update(ls => [...ls, this.emptyLine()]);
  }

  removeLine(i: number): void {
    if (this.lines().length <= 1) return;
    this.lines.update(ls => ls.filter((_, idx) => idx !== i));
  }

  patchLine(i: number, field: keyof LineForm, value: string | number): void {
    this.lines.update(ls => {
      const copy = [...ls];
      copy[i] = { ...copy[i], [field]: typeof value === 'string' ? (isNaN(+value) ? value : +value) : value };
      return copy;
    });
  }
  openCatalog(): void {
    this.catalogSearch.set('');
    this.loadCatalogItems('');
    this.showCatalogModal.set(true);
  }

  closeCatalog(): void {
    this.showCatalogModal.set(false);
    this.catalogItems.set([]);
  }

  onCatalogSearch(val: string): void {
    this.catalogSearch.set(val);
    this.catalog$.next(val);
  }

  loadCatalogItems(query: string): void {
    this.catalogLoading.set(true);
    const obs$ = query.trim()
      ? this.catalogSvc.search(query.trim(), 0, 50)
      : this.catalogSvc.getActive(true, 0, 50);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: page => { this.catalogItems.set(page.content); this.catalogLoading.set(false); },
      error: ()  => this.catalogLoading.set(false),
    });
  }

  /** Añade un ítem del catálogo como nueva línea y cierra el modal */
  addCatalogItem(item: CatalogItemResponse): void {
    const newLine: LineForm = {
      description:        item.name + (item.description ? ` — ${item.description}` : ''),
      quantity:           1,
      unitPrice:          item.unitPrice,
      discountPercentage: 0,
      taxRate:            item.taxRate ?? 21,
    };
    this.lines.update(ls => {
      const last = ls[ls.length - 1];
      if (last && !last.description.trim() && last.unitPrice === 0) {
        return [...ls.slice(0, -1), newLine];
      }
      return [...ls, newLine];
    });
    this.closeCatalog();
  }
  save(): void {
    const f = this.form();
    console.log(f)
    if (!f.clientId)   { this.modalError.set('Selecciona un cliente'); return; }
    if (!f.issueDate)  { this.modalError.set('La fecha de emisión es obligatoria'); return; }
    if (!f.validUntil) { this.modalError.set('La fecha de validez es obligatoria'); return; }

    const lineList = this.lines();
    if (lineList.some(l => !l.description.trim())) {
      this.modalError.set('Todas las líneas deben tener descripción');
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set('');

    const payload: CreateQuoteRequest = {
      clientId:   f.clientId,
      seriesId:   f.seriesId   || undefined,
      issueDate:  f.issueDate,
      validUntil: f.validUntil,
      title:      f.title  || undefined,
      notes:      f.notes  || undefined,
      terms:      f.terms  || undefined,
      lines:      lineList.map((l, i): QuoteLineRequest => ({
        description:        l.description,
        quantity:           l.quantity,
        unitPrice:          l.unitPrice,
        discountPercentage: l.discountPercentage || undefined,
        taxRate:            l.taxRate,
        lineOrder:          i + 1,
      })),
    };

    const obs$ = this.isEditing()
      ? this.svc.update(this.editingQuote()!.id, payload)
      : this.svc.create(payload);

    obs$.subscribe({
      next: () => { this.modalLoading.set(false); this.closeModal(); this.loadQuotes(); },
      error: () => { this.modalLoading.set(false); this.modalError.set('Error al guardar el presupuesto. Revisa los datos.'); },
    });
  }
  openDetail(quote: QuoteResponse): void {
    this.detailLoading.set(true);
    this.showDetail.set(true);
    this.detailQuote.set(quote);
    this.svc.getById(quote.id).subscribe({
      next: full => { this.detailQuote.set(full); this.detailLoading.set(false); },
      error: ()   => this.detailLoading.set(false),
    });
  }

  closeDetail(): void { this.showDetail.set(false); this.detailQuote.set(null); }
  sendQuote(quote: QuoteResponse): void {
    this.svc.send(quote.id).subscribe({ next: u => { this.detailQuote.set(u); this.loadQuotes(); } });
  }

  approveQuote(quote: QuoteResponse): void {
    this.svc.approve(quote.id).subscribe({ next: u => { this.detailQuote.set(u); this.loadQuotes(); } });
  }

  openReject(quote: QuoteResponse): void {
    this.rejectingQuote.set(quote);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  closeReject(): void { this.showRejectModal.set(false); this.rejectingQuote.set(null); }

  confirmReject(): void {
    const q = this.rejectingQuote();
    if (!q) return;
    this.rejectLoading.set(true);
    this.svc.reject(q.id, this.rejectReason() || undefined).subscribe({
      next: u => { this.rejectLoading.set(false); this.closeReject(); this.detailQuote.set(u); this.loadQuotes(); },
      error: () => this.rejectLoading.set(false),
    });
  }

  convertQuote(quote: QuoteResponse): void {
    this.svc.convertToInvoice(quote.id).subscribe({ next: () => { this.closeDetail(); this.loadQuotes(); } });
  }

  downloadPdf(quote: QuoteResponse): void {
    this.svc.downloadPdf(quote.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = `presupuesto-${quote.number}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
  openDelete(quote: QuoteResponse): void {
    this.deletingQuote.set(quote);
    this.showDeleteModal.set(true);
    this.showDetail.set(false);
  }

  closeDelete(): void { this.showDeleteModal.set(false); this.deletingQuote.set(null); }

  confirmDelete(): void {
    const q = this.deletingQuote();
    if (!q) return;
    this.deleteLoading.set(true);
    this.svc.delete(q.id).subscribe({
      next: () => { this.deleteLoading.set(false); this.closeDelete(); this.loadQuotes(); },
      error: () => this.deleteLoading.set(false),
    });
  }
  patchForm(field: keyof ReturnType<typeof this.form>, value: string): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  statusLabel(s: QuoteStatus): string {
    const map: Record<QuoteStatus, string> = {
      DRAFT: 'Borrador', SENT: 'Enviado', VIEWED: 'Visto',
      APPROVED: 'Aprobado', REJECTED: 'Rechazado', EXPIRED: 'Expirado', CONVERTED: 'Convertido',
    };
    return map[s] ?? s;
  }

  statusVariant(s: QuoteStatus): BadgeVariant {
    const map: Record<QuoteStatus, BadgeVariant> = {
      DRAFT: 'default', SENT: 'primary', VIEWED: 'info',
      APPROVED: 'success', REJECTED: 'danger', EXPIRED: 'warning', CONVERTED: 'success',
    };
    return map[s] ?? 'default';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  }

  isExpired(validUntil: string): boolean { return new Date(validUntil) < new Date(); }
  canEdit(s: QuoteStatus):         boolean { return s === 'DRAFT'; }
  canSend(s: QuoteStatus):         boolean { return s === 'DRAFT'; }
  canApproveReject(s: QuoteStatus):boolean { return s === 'SENT' || s === 'VIEWED'; }
  canConvert(s: QuoteStatus):      boolean { return s === 'APPROVED'; }

  get pages(): number[] {
    const total = this.totalPages(), cur = this.currentPage(), delta = 2;
    const range: number[] = [];
    for (let i = Math.max(0, cur - delta); i <= Math.min(total - 1, cur + delta); i++) range.push(i);
    return range;
  }
}
