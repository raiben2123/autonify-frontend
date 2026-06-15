import { Injectable, inject } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PermissionService } from '../../core/auth/permission.service';
import { FiscalSummaryResponse } from '../../core/models/fiscal.model';
import { InvoiceResponse } from '../../core/models/invoice.model';
import { ProjectResponse } from '../../core/models/project.model';
import { Page } from '../../core/models/api.model';

export interface DashboardData {
  fiscalSummary:   FiscalSummaryResponse | null;
  recentInvoices:  Page<InvoiceResponse> | null;
  pendingInvoices: Page<InvoiceResponse> | null;
  activeProjects:  Page<ProjectResponse> | null;
}

const EMPTY_PAGE = <T>(): Page<T> => ({
  content: [], totalElements: 0, totalPages: 0, size: 0, number: 0,
});

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api         = inject(ApiService);
  private permissions = inject(PermissionService);

  load(): Observable<DashboardData> {
    const canFiscal   = this.permissions.canAccess('fiscal');
    const canInvoices = this.permissions.canAccess('invoices');
    const canProjects = this.permissions.canAccess('projects');

    return forkJoin({
      fiscalSummary: canFiscal
        ? this.api.get<FiscalSummaryResponse>('/fiscal/summary/current')
        : of(null),

      recentInvoices: canInvoices
        ? this.api.list<InvoiceResponse>('/invoices', { pageSize: 5, sort: 'createdAt:desc' })
        : of(null),

      pendingInvoices: canInvoices
        ? this.api.list<InvoiceResponse>('/invoices', { pageSize: 1, filter: 'status:eq:PENDING' })
        : of(null),

      activeProjects: canProjects
        ? this.api.list<ProjectResponse>('/projects', { pageSize: 1, filter: 'status:eq:ACTIVE' })
        : of(null),
    });
  }
}
