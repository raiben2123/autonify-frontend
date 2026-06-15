export type TimeEntryStatus = 'RUNNING' | 'STOPPED';

export interface TimeEntryResponse {
  id: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  status: TimeEntryStatus;
  date: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  description?: string;
  billable: boolean;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryRequest {
  date: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  description?: string;
  projectId?: string;
  billable?: boolean;
  hourlyRate?: number;
}

export interface UpdateTimeEntryRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  description?: string;
  projectId?: string;
  billable?: boolean;
  hourlyRate?: number;
}

export interface StartTimerRequest {
  projectId?: string;
  description?: string;
  billable?: boolean;
  hourlyRate?: number;
}
