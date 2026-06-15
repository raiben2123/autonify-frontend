import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardData } from './dashboard.service';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/auth/permission.service';
import { InvoiceStatus } from '../../core/models/invoice.model';
import { BadgeVariant } from '../../shared/components/badge/badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent, SpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  readonly auth            = inject(AuthService);
  readonly permissions     = inject(PermissionService);

  data    = signal<DashboardData | null>(null);
  loading = signal(true);
  error   = signal('');
  readonly canFiscal   = this.permissions.canAccess('fiscal');
  readonly canInvoices = this.permissions.canAccess('invoices');
  readonly canProjects = this.permissions.canAccess('projects');
  readonly canClients  = this.permissions.canAccess('clients');

  ngOnInit(): void {
    this.dashboardService.load().subscribe({
      next:  data  => { this.data.set(data);  this.loading.set(false); },
      error: ()    => { this.error.set('Error al cargar el dashboard'); this.loading.set(false); },
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  invoiceStatusBadge(status: InvoiceStatus): BadgeVariant {
    const map: Record<InvoiceStatus, BadgeVariant> = {
      DRAFT:     'default',
      PENDING:   'warning',
      SENT:      'info',
      VIEWED:    'info',
      PAID:      'success',
      OVERDUE:   'danger',
      CANCELLED: 'default',
    };
    return map[status];
  }

  invoiceStatusLabel(status: InvoiceStatus): string {
    const map: Record<InvoiceStatus, string> = {
      DRAFT:     'Borrador',
      PENDING:   'Pendiente',
      SENT:      'Enviada',
      VIEWED:    'Vista',
      PAID:      'Pagada',
      OVERDUE:   'Vencida',
      CANCELLED: 'Anulada',
    };
    return map[status];
  }

  formatCurrency(amount: number | undefined | null): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
      .format(amount ?? 0);
  }
}
