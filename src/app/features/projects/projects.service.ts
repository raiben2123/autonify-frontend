import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Page } from '../../core/models/api.model';
import {
  ProjectResponse, CreateProjectRequest, UpdateProjectRequest,
  ProjectMemberResponse, AddProjectMemberRequest,
} from '../../core/models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private api = inject(ApiService);

  list(page = 0, pageSize = 20, search?: string): Observable<Page<ProjectResponse>> {
    return this.api.listWithParams<ProjectResponse>('/projects',
      search ? { search } : {},
      page, pageSize, 'createdAt,desc',
    );
  }

  getById(id: string): Observable<ProjectResponse> {
    return this.api.get<ProjectResponse>(`/projects/${id}`);
  }

  create(body: CreateProjectRequest): Observable<ProjectResponse> {
    return this.api.post<ProjectResponse>('/projects', body);
  }

  update(id: string, body: UpdateProjectRequest): Observable<ProjectResponse> {
    return this.api.put<ProjectResponse>(`/projects/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/projects/${id}`);
  }

  getMembers(projectId: string): Observable<ProjectMemberResponse[]> {
    return this.api.get<ProjectMemberResponse[]>(`/projects/${projectId}/members`);
  }

  addMember(projectId: string, body: AddProjectMemberRequest): Observable<ProjectMemberResponse> {
    return this.api.post<ProjectMemberResponse>(`/projects/${projectId}/members`, body);
  }

  removeMember(projectId: string, userId: string): Observable<void> {
    return this.api.delete<void>(`/projects/${projectId}/members/${userId}`);
  }
}
