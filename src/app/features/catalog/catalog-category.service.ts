import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { CatalogCategoryRequest, CatalogCategoryResponse } from '../../core/models/catalog-category.model';
import { Page } from '../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class CatalogCategoryService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/catalog/categories';

  list(page = 0, size = 20, sortOrder = 'asc'): Observable<Page<CatalogCategoryResponse>> {
    return this.api.listWithParams<CatalogCategoryResponse>(
      this.baseUrl,
      {},
      page,
      size,
      `sortOrder,${sortOrder}`
    );
  }

  getActive(): Observable<CatalogCategoryResponse[]> {
    return this.api.get<CatalogCategoryResponse[]>(`${this.baseUrl}/active`);
  }

  getById(id: string): Observable<CatalogCategoryResponse> {
    return this.api.get<CatalogCategoryResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: CatalogCategoryRequest): Observable<CatalogCategoryResponse> {
    return this.api.post<CatalogCategoryResponse>(this.baseUrl, request);
  }

  update(id: string, request: CatalogCategoryRequest): Observable<CatalogCategoryResponse> {
    return this.api.put<CatalogCategoryResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`${this.baseUrl}/${id}`);
  }
}
