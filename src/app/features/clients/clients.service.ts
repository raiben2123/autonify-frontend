import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nif: string | null;
  legalName: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  province: string | null;
  country: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPage {
  content: Client[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  nif?: string;
  legalName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export type UpdateClientRequest = CreateClientRequest;

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clients`;

  getAll(page = 0, size = 20, search?: string): Observable<ClientPage> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'name,asc');
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<ClientPage>(this.base, { params });
  }

  getById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.base}/${id}`);
  }

  create(data: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(this.base, data);
  }

  update(id: string, data: UpdateClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
