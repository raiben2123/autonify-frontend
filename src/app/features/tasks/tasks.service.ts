import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Page } from '../../core/models/api.model';
import {
  TaskResponse, CreateTaskRequest, UpdateTaskRequest,
  TaskStatus, TaskAssigneeResponse, AddTaskAssigneeRequest,
} from '../../core/models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private api = inject(ApiService);

  list(page = 0, pageSize = 50, filters?: { status?: TaskStatus; projectId?: string; assigneeId?: string }): Observable<Page<TaskResponse>> {
    const params: Record<string, string | undefined> = {};
    if (filters?.status)     params['status']     = filters.status;
    if (filters?.projectId)  params['projectId']  = filters.projectId;
    if (filters?.assigneeId) params['assigneeId'] = filters.assigneeId;
    return this.api.listWithParams<TaskResponse>('/tasks', params, page, pageSize, 'position,asc');
  }

  /** Endpoint kanban: todas las tareas de un proyecto para un estado concreto */
  getByProjectAndStatus(projectId: string, status: TaskStatus): Observable<TaskResponse[]> {
    return this.api.get<TaskResponse[]>(`/tasks/project/${projectId}/status/${status}`);
  }

  getById(id: string): Observable<TaskResponse> {
    return this.api.get<TaskResponse>(`/tasks/${id}`);
  }

  create(body: CreateTaskRequest): Observable<TaskResponse> {
    return this.api.post<TaskResponse>('/tasks', body);
  }

  update(id: string, body: UpdateTaskRequest): Observable<TaskResponse> {
    return this.api.put<TaskResponse>(`/tasks/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/tasks/${id}`);
  }
  getAssignees(taskId: string): Observable<TaskAssigneeResponse[]> {
    return this.api.get<TaskAssigneeResponse[]>(`/tasks/${taskId}/assignees`);
  }

  addAssignee(taskId: string, body: AddTaskAssigneeRequest): Observable<TaskAssigneeResponse> {
    return this.api.post<TaskAssigneeResponse>(`/tasks/${taskId}/assignees`, body);
  }

  removeAssignee(taskId: string, userId: string): Observable<void> {
    return this.api.delete<void>(`/tasks/${taskId}/assignees/${userId}`);
  }
}
