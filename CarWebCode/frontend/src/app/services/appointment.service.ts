
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateAppointment,
  AppointmentResponse
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/appointments`;

  createAppointment(
    appointment: CreateAppointment & { carId: number }
  ): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(
      this.baseUrl,
      appointment
    );
  }
}
