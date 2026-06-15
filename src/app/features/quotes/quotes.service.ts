import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import { Page } from '../../core/models/api.model';
import {
  QuoteResponse,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  QuoteStatus,
  QuoteSeriesResponse,
} from '../../core/models/quote.model';
import { ClientResponse } from '../../core/models/client.model';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly api  = inject(ApiService);
  private readonly http = inject(HttpClient); // solo para blob (PDF)
  getAll(page = 0, size = 20): Observable<Page<QuoteResponse>> {
    return this.api.listWithParams<QuoteResponse>('/quotes', {}, page, size, 'createdAt,desc');
  }

  search(query: string, page = 0, size = 20): Observable<Page<QuoteResponse>> {
    return this.api.listWithParams<QuoteResponse>('/quotes/search', { query }, page, size, 'createdAt,desc');
  }

  getByStatus(status: QuoteStatus, page = 0, size = 20): Observable<Page<QuoteResponse>> {
    return this.api.listWithParams<QuoteResponse>(`/quotes/status/${status}`, {}, page, size, 'createdAt,desc');
  }

  getByClient(clientId: string, page = 0, size = 20): Observable<Page<QuoteResponse>> {
    return this.api.listWithParams<QuoteResponse>(`/quotes/client/${clientId}`, {}, page, size, 'createdAt,desc');
  }

  getById(id: string): Observable<QuoteResponse> {
    return this.api.get<QuoteResponse>(`/quotes/${id}`);
  }
  create(data: CreateQuoteRequest): Observable<QuoteResponse> {
    return this.api.post<QuoteResponse>('/quotes', data);
  }

  update(id: string, data: UpdateQuoteRequest): Observable<QuoteResponse> {
    return this.api.put<QuoteResponse>(`/quotes/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`/quotes/${id}`);
  }
  send(id: string): Observable<QuoteResponse> {
    return this.api.post<QuoteResponse>(`/quotes/${id}/send`, {});
  }

  approve(id: string): Observable<QuoteResponse> {
    return this.api.post<QuoteResponse>(`/quotes/${id}/approve`, {});
  }

  reject(id: string, reason?: string): Observable<QuoteResponse> {
    return this.api.post<QuoteResponse>(`/quotes/${id}/reject`, reason ? { reason } : {});
  }

  convertToInvoice(id: string): Observable<string> {
    return this.api.post<string>(`/quotes/${id}/convert`, {});
  }
  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/quotes/${id}/pdf`, { responseType: 'blob' });
  }
  getSeries(): Observable<QuoteSeriesResponse[]> {
    return this.api.get<QuoteSeriesResponse[]>('/quote-series');
  }

  getClients(page = 0, size = 200): Observable<Page<ClientResponse>> {
    return this.api.listWithParams<ClientResponse>('/clients', {}, page, size, 'name,asc');
  }
}
