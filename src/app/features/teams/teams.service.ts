import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Page } from '../../core/models/api.model';
import {
  TeamResponse, TeamMemberResponse,
  CreateTeamRequest, UpdateTeamRequest, AddTeamMemberRequest,
} from '../../core/models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private api = inject(ApiService);

  list(page = 0, pageSize = 50): Observable<Page<TeamResponse>> {
    return this.api.list<TeamResponse>('/teams', { page, pageSize });
  }

  getById(id: string): Observable<TeamResponse> {
    return this.api.get<TeamResponse>(`/teams/${id}`);
  }

  create(body: CreateTeamRequest): Observable<TeamResponse> {
    return this.api.post<TeamResponse>('/teams', body);
  }

  update(id: string, body: UpdateTeamRequest): Observable<TeamResponse> {
    return this.api.put<TeamResponse>(`/teams/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/teams/${id}`);
  }

  getMembers(teamId: string): Observable<TeamMemberResponse[]> {
    return this.api.get<TeamMemberResponse[]>(`/teams/${teamId}/members`);
  }

  addMember(teamId: string, body: AddTeamMemberRequest): Observable<TeamMemberResponse> {
    return this.api.post<TeamMemberResponse>(`/teams/${teamId}/members`, body);
  }

  removeMember(teamId: string, userId: string): Observable<void> {
    return this.api.delete<void>(`/teams/${teamId}/members/${userId}`);
  }
}
