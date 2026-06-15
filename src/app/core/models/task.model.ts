export type TaskStatus   = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskResponse {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  position?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssigneeResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: string;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  position?: number;
}

export interface AddTaskAssigneeRequest {
  userId: string;
}

export const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO',        label: 'Por hacer' },
  { status: 'IN_PROGRESS', label: 'En progreso' },
  { status: 'REVIEW',      label: 'En revisión' },
  { status: 'DONE',        label: 'Hecho' },
];
