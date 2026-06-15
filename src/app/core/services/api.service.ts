import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListOptions, Page } from '../models/api.model';

/**
 * Servicio centralizado de comunicación con el backend.
 *
 * Es el ÚNICO punto del frontend que habla con la API REST.
 * Todos los feature services deben inyectar ApiService en lugar de HttpClient.
 *
 * Encapsula:
 * - URL base (environment.apiUrl)
 * - Headers de FlexibleQuery (X-Page, X-Page-Size, X-Sort, X-Filter, X-Fields, X-Include)
 * - Prefijo /v1 para endpoints versionados
 *
 * Uso básico:
 *   this.api.list<ClientResponse>('/clients')
 *   this.api.list<ClientResponse>('/clients', { page: 0, pageSize: 20, sort: 'name:asc' })
 *   this.api.list<ClientResponse>('/clients', { filter: 'status:eq:ACTIVE,name:contains:acme' })
 *   this.api.get<ClientResponse>('/clients/123')
 *   this.api.post<ClientResponse>('/clients', body)
 *   this.api.put<ClientResponse>('/clients/123', body)
 *   this.api.patch<void>('/clients/123/deactivate', {})
 *   this.api.delete('/clients/123')
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.url(path));
  }

  /**
   * GET simple con query params (para endpoints que usan @RequestParam + Pageable estándar).
   * Ej: /tasks?projectId=uuid&status=TODO
   *     /projects?status=ACTIVE&page=0&size=20&sort=createdAt,desc
   */
  getWithParams<T>(path: string, params: Record<string, string | number | boolean | undefined | null>): Observable<T> {
    let httpParams = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    }
    return this.http.get<T>(this.url(path), { params: httpParams });
  }

  /**
   * GET paginado con query params estándar de Spring Pageable.
   * Combina filtros propios (?status=) con paginación (?page=0&size=20&sort=createdAt,desc).
   */
  listWithParams<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    page = 0,
    size = 20,
    sort = 'createdAt,desc',
  ): Observable<Page<T>> {
    const merged: Record<string, string | number | boolean> = { page, size, sort };
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          merged[k] = v as string | number | boolean;
        }
      }
    }
    return this.getWithParams<Page<T>>(path, merged);
  }

  /**
   * GET paginado. Las opciones se envían como headers HTTP (X-Page, X-Sort, etc.)
   * que el FlexibleApiInterceptor del backend lee y aplica.
   */
  list<T>(path: string, options?: ListOptions): Observable<Page<T>> {
    const headers = this.buildFlexibleHeaders(options);
    return this.http.get<Page<T>>(this.url(path), { headers });
  }

  /**
   * Búsqueda con query param ?search=... (para endpoints que lo soporten)
   * combinada con FlexibleQuery headers para paginación y sort.
   */
  search<T>(path: string, query: string, options?: ListOptions): Observable<Page<T>> {
    const headers = this.buildFlexibleHeaders(options);
    const params = new HttpParams().set('search', query);
    return this.http.get<Page<T>>(this.url(path), { headers, params });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  /**
   * Construye la URL completa.
   * environment.apiUrl ya incluye el context-path /api del servidor.
   *
   * Ejemplos:
   *   '/clients'           → http://host/api/clients
   *   '/fiscal/summary/current' → http://host/api/fiscal/summary/current
   *   '/auth/login'        → http://host/api/auth/login
   */
  private url(path: string): string {
    return `${this.base}${path}`;
  }

  /**
   * Traduce ListOptions a headers HTTP para el FlexibleApiInterceptor del backend.
   * Solo incluye los headers que tienen valor definido.
   */
  private buildFlexibleHeaders(options?: ListOptions): HttpHeaders {
    let headers = new HttpHeaders();

    if (!options) return headers;

    if (options.page !== undefined) {
      headers = headers.set('X-Page', String(options.page));
    }
    if (options.pageSize !== undefined) {
      headers = headers.set('X-Page-Size', String(options.pageSize));
    }
    if (options.sort) {
      headers = headers.set('X-Sort', options.sort);
    }
    if (options.filter) {
      headers = headers.set('X-Filter', options.filter);
    }
    if (options.fields) {
      headers = headers.set('X-Fields', options.fields);
    }
    if (options.include) {
      headers = headers.set('X-Include', options.include);
    }

    return headers;
  }
}
