export type ItemType = 'PRODUCT' | 'SERVICE';

export interface CatalogItemResponse {
  id: string;
  itemType: ItemType;
  code?: string;
  name: string;
  description?: string;
  unitPrice: number;
  taxRate?: number;
  unit?: string;
  active: boolean;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogItemRequest {
  categoryId?: string;
  itemType: ItemType;
  code?: string;
  name: string;
  description?: string;
  unitPrice: number;
  taxRate?: number;
  unit?: string;
}

export interface UpdateCatalogItemRequest {
  categoryId?: string;
  itemType?: ItemType;
  code?: string;
  name?: string;
  description?: string;
  unitPrice?: number;
  taxRate?: number;
  unit?: string;
  active?: boolean;
}
