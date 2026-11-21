import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PendingTestDriveAppointment,
  ScheduleTestDriveRequest,
  TestDrive,
  UpcomingTestDrive,
} from '../models/test-drive.model';

@Injectable({ providedIn: 'root' })
export class TestDriveService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/test-drives`;

  listUpcoming(): Observable<UpcomingTestDrive[]> {
    return this.http.get<UpcomingTestDrive[]>(this.baseUrl);
  }

  listPendingAppointments(): Observable<PendingTestDriveAppointment[]> {
    return this.http.get<PendingTestDriveAppointment[]>(`${this.baseUrl}/pending-appointments`);
  }

  /** Fails with 409 when the car already has a test drive in that time range. */
  schedule(request: ScheduleTestDriveRequest): Observable<TestDrive> {
    return this.http.post<TestDrive>(this.baseUrl, request);
  }
}
