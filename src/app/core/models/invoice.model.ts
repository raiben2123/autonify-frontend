export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceLineResponse {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface InvoiceResponse {
  id: string;
  number: string;
  series: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  clientId: string;
  clientName: string;
  notes?: string;
  lines?: InvoiceLineResponse[];
  createdAt: string;
}

export interface CreateInvoiceRequest {
  clientId: string;
  seriesId?: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {}
