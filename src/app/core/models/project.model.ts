export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectRole = 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export interface ProjectMemberResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: ProjectRole;
  assignedAt: string;
}

export interface AddProjectMemberRequest {
  userId: string;
  role?: ProjectRole;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  code?: string;
  status: ProjectStatus;
  billable: boolean;
  hourlyRate?: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  clientName?: string;
  teamId?: string;
  teamName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  code?: string;
  clientId?: string;
  teamId?: string;
  billable?: boolean;
  hourlyRate?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  code?: string;
  clientId?: string;
  teamId?: string;
  status?: ProjectStatus;
  billable?: boolean;
  hourlyRate?: number;
  startDate?: string;
  endDate?: string;
}
