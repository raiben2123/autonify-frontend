import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Page } from '../../core/models/api.model';
import {
  TeamMember,
  CreateUserRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserPreferences,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  Invitation,
  CreateInvitationRequest,
  User,
} from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  getProfile(): Observable<User> {
    return this.api.get<User>('/users/me');
  }

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.api.put<User>('/users/me', data);
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.api.put<void>('/users/me/password', data);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.api.get<UserPreferences>('/users/me/preferences');
  }

  updatePreferences(data: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.api.put<UserPreferences>('/users/me/preferences', data);
  }

  getTeam(page = 0, pageSize = 20): Observable<Page<TeamMember>> {
    return this.api.list<TeamMember>('/users', { page, pageSize });
  }

  createUser(data: CreateUserRequest): Observable<TeamMember> {
    return this.api.post<TeamMember>('/users', data);
  }

  deactivateUser(id: string): Observable<TeamMember> {
    return this.api.patch<TeamMember>(`/users/${id}/deactivate`);
  }

  activateUser(id: string): Observable<TeamMember> {
    return this.api.patch<TeamMember>(`/users/${id}/activate`);
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete(`/users/${id}`);
  }

  changeUserRole(userId: string, roleId: string): Observable<TeamMember> {
    return this.api.patch<TeamMember>(`/users/${userId}/role`, { roleId });
  }

  getRoles(): Observable<Role[]> {
    return this.api.get<Role[]>('/roles');
  }

  createRole(data: CreateRoleRequest): Observable<Role> {
    return this.api.post<Role>('/roles', data);
  }

  updateRole(id: string, data: UpdateRoleRequest): Observable<Role> {
    return this.api.put<Role>(`/roles/${id}`, data);
  }

  deleteRole(id: string): Observable<void> {
    return this.api.delete(`/roles/${id}`);
  }

  getInvitations(): Observable<Page<Invitation>> {
    return this.api.list<Invitation>('/invitations');
  }

  createInvitation(data: CreateInvitationRequest): Observable<Invitation> {
    return this.api.post<Invitation>('/invitations', data);
  }

  cancelInvitation(id: string): Observable<void> {
    return this.api.delete(`/invitations/${id}`);
  }

  resendInvitation(id: string): Observable<Invitation> {
    return this.api.post<Invitation>(`/invitations/${id}/resend`, {});
  }
}
