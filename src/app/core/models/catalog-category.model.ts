export interface CatalogCategoryResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
}
