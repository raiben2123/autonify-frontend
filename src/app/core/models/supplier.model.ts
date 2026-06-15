export interface SupplierResponse {
  id: string;
  name: string;
  legalName?: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country: string;
  contactPerson?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  legalName?: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  active?: boolean;
}
