import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AppointmentResponse,
  CreateAppointment,
  ManagedAppointment,
  ModifyAppointmentResponse,
  StaffAppointment,
  StaffAppointmentList,
  StatusAction,
} from '../models/appointment.model';
import { AuthService } from './auth.service';

interface OkResponse {
  ok: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/appointments`;

  /** `carId` is optional only for a "Sale evaluation". */
  createAppointment(
    appointment: CreateAppointment & { carId?: number | null },
  ): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.baseUrl, appointment);
  }

  // ---- Staff (needs the session token) ----

  listAll(): Observable<StaffAppointment[]> {
    return this.http
      .get<StaffAppointmentList>(this.baseUrl, { headers: this.staffHeaders() })
      .pipe(map((response) => response.data));
  }

  /** Confirm, reject or cancel. Rejecting and cancelling need a reason. */
  updateStatus(id: number, status: StatusAction, reason?: string): Observable<OkResponse> {
    return this.http.patch<OkResponse>(
      `${this.baseUrl}/${id}/status`,
      reason ? { status, reason } : { status },
      { headers: this.staffHeaders() },
    );
  }

  /** `appointmentDatetime`: "YYYY-MM-DD HH:mm". */
  reschedule(id: number, appointmentDatetime: string): Observable<OkResponse> {
    return this.http.patch<OkResponse>(
      `${this.baseUrl}/${id}/reschedule`,
      { appointmentDatetime },
      { headers: this.staffHeaders() },
    );
  }

  // ---- Customer (proves ownership with the token of the manage link) ----

  getManaged(id: number, token: string): Observable<ManagedAppointment> {
    return this.http.get<ManagedAppointment>(`${this.baseUrl}/${id}/manage`, {
      headers: new HttpHeaders({ 'X-Manage-Token': token }),
    });
  }

  /** `newDatetime`: "YYYY-MM-DD HH:mm". */
  modify(id: number, token: string, newDatetime: string): Observable<ModifyAppointmentResponse> {
    return this.http.patch<ModifyAppointmentResponse>(`${this.baseUrl}/${id}/modify`, { token, newDatetime });
  }

  cancel(id: number, token: string, reason?: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/cancel`, {
      token,
      confirm: true,
      ...(reason ? { reason } : {}),
    });
  }

  private staffHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token() ?? ''}` });
  }
}

/** Path and query of the customer's "manage your appointment" page. */
export function manageLink(appointmentId: number, token: string): { path: string[]; query: { token: string } } {
  return { path: ['/appointments', String(appointmentId), 'manage'], query: { token } };
}
