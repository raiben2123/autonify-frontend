
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId: string;
  tenantId: string;
  tenantName: string;
  jobTitle: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  jobTitle?: string;
  roleName: string;
  roleId: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  roleId: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  weekStartsOn: 'MONDAY' | 'SUNDAY';
}

export interface RolePermission {
  module:    string;
  canView:   boolean;
  canCreate: boolean;
  canEdit:   boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  defaultRole?: boolean;
  permissions?: RolePermission[];
}

export interface RolePermissionRequest {
  module:    string;
  canView:   boolean;
  canCreate: boolean;
  canEdit:   boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: RolePermissionRequest[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: RolePermissionRequest[];
}

export interface Invitation {
  id: string;
  email: string;
  roleName: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  email: string;
  roleId: string;
}
