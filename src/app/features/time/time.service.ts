import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Page } from '../../core/models/api.model';
import {
  TimeEntryResponse, CreateTimeEntryRequest,
  UpdateTimeEntryRequest, StartTimerRequest,
} from '../../core/models/time-entry.model';

@Injectable({ providedIn: 'root' })
export class TimeService {
  private api = inject(ApiService);

  list(page = 0, pageSize = 20): Observable<Page<TimeEntryResponse>> {
    return this.api.listWithParams<TimeEntryResponse>('/time-entries', {}, page, pageSize, 'date,desc');
  }

  listByUser(userId: string, page = 0, pageSize = 20): Observable<Page<TimeEntryResponse>> {
    return this.api.listWithParams<TimeEntryResponse>(`/time-entries/user/${userId}`, {}, page, pageSize, 'date,desc');
  }

  getById(id: string): Observable<TimeEntryResponse> {
    return this.api.get<TimeEntryResponse>(`/time-entries/${id}`);
  }

  getRunningTimer(): Observable<TimeEntryResponse> {
    return this.api.get<TimeEntryResponse>('/time-entries/timer/running');
  }

  create(body: CreateTimeEntryRequest): Observable<TimeEntryResponse> {
    return this.api.post<TimeEntryResponse>('/time-entries', body);
  }

  update(id: string, body: UpdateTimeEntryRequest): Observable<TimeEntryResponse> {
    return this.api.put<TimeEntryResponse>(`/time-entries/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/time-entries/${id}`);
  }

  startTimer(body: StartTimerRequest): Observable<TimeEntryResponse> {
    return this.api.post<TimeEntryResponse>('/time-entries/timer/start', body);
  }

  stopTimer(id: string): Observable<TimeEntryResponse> {
    return this.api.post<TimeEntryResponse>(`/time-entries/timer/${id}/stop`, {});
  }
}
