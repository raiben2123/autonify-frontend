/**
 * Respuesta paginada estándar de Spring (Page<T>)
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // página actual (0-based)
}

/**
 * Opciones para llamadas de listado con FlexibleQuery.
 * Se traducen a headers HTTP que el backend interpreta.
 *
 * X-Page        → page
 * X-Page-Size   → pageSize
 * X-Sort        → sort   (ej: "name:asc" o "createdAt:desc,name:asc")
 * X-Filter      → filter (ej: "status:eq:ACTIVE,name:contains:acme")
 * X-Fields      → fields (ej: "id,name,email")
 * X-Include     → include (ej: "client,lines")
 */
export interface ListOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  filter?: string;
  fields?: string;
  include?: string;
}

/**
 * Respuesta de error estándar del GlobalExceptionHandler
 */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
}
