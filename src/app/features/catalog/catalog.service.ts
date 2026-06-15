import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import {
  CatalogItemResponse,
  CreateCatalogItemRequest,
  UpdateCatalogItemRequest,
  ItemType,
} from '../../core/models/catalog-item.model';
import { Page } from '../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class CatalogItemService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = '/catalog/items';

  list(page = 0, size = 20): Observable<Page<CatalogItemResponse>> {
    return this.api.listWithParams<CatalogItemResponse>(this.baseUrl, {}, page, size, 'name,asc');
  }

  getById(id: string): Observable<CatalogItemResponse> {
    return this.api.get<CatalogItemResponse>(`${this.baseUrl}/${id}`);
  }

  getActive(active = true, page = 0, size = 20): Observable<Page<CatalogItemResponse>> {
    return this.api.listWithParams<CatalogItemResponse>(
      `${this.baseUrl}/active`,
      { active },
      page,
      size,
      'name,asc'
    );
  }

  getByType(itemType: ItemType, page = 0, size = 20): Observable<Page<CatalogItemResponse>> {
    return this.api.listWithParams<CatalogItemResponse>(
      `${this.baseUrl}/type/${itemType}`,
      {},
      page,
      size,
      'name,asc'
    );
  }

  getByTypeAndActive(itemType: ItemType, active = true, page = 0, size = 20): Observable<Page<CatalogItemResponse>> {
    return this.api.listWithParams<CatalogItemResponse>(
      `${this.baseUrl}/type/${itemType}/active`,
      { active },
      page,
      size,
      'name,asc'
    );
  }

  getByCategory(categoryId: string, page = 0, size = 20): Observable<Page<CatalogItemResponse>> {
    return this.api.listWithParams<CatalogItemResponse>(
      `${this.baseUrl}/category/${categoryId}`,
      {},
      page,
      size,
      'name,asc'
    );
  }

  search(query: string, page = 0, size = 20): Observable<Page<CatalogItemResponse>> {
    return this.api.listWithParams<CatalogItemResponse>(
      `${this.baseUrl}/search`,
      { query },
      page,
      size,
      'name,asc'
    );
  }

  create(request: CreateCatalogItemRequest): Observable<CatalogItemResponse> {
    return this.api.post<CatalogItemResponse>(this.baseUrl, request);
  }

  update(id: string, request: UpdateCatalogItemRequest): Observable<CatalogItemResponse> {
    return this.api.put<CatalogItemResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(`${this.baseUrl}/${id}`);
  }
}
