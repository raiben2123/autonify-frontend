export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface QuoteLineResponse {
  id: string;
  lineOrder: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface QuoteResponse {
  id: string;
  number: string;
  status: QuoteStatus;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  seriesId: string;
  seriesName: string;
  seriesPrefix: string;
  issueDate: string;
  validUntil: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  title?: string;
  notes?: string;
  terms?: string;
  rejectionReason?: string;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  convertedAt?: string;
  lines?: QuoteLineResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLineRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  taxRate: number;
  lineOrder?: number;
}

export interface CreateQuoteRequest {
  clientId: string;
  seriesId?: string;
  issueDate: string;
  validUntil: string;
  title?: string;
  notes?: string;
  terms?: string;
  lines: QuoteLineRequest[];
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {}

export interface QuoteSeriesResponse {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
  isDefault: boolean;
  active: boolean;
}
