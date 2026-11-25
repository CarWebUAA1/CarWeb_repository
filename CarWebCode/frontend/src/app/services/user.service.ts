import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  StaffDetailsRequest,
  StaffListResponse,
  StaffMutationResponse,
  StaffMember,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials);
  }

  getStaff(search = ''): Observable<StaffListResponse> {
    return this.http.get<StaffListResponse>(this.baseUrl, {
      headers: this.authHeaders(),
      params: search ? { search } : {},
    });
  }

  registerStaff(staff: StaffDetailsRequest): Observable<StaffMutationResponse> {
    return this.http.post<StaffMutationResponse>(this.baseUrl, staff, {
      headers: this.authHeaders(),
    });
  }

  updateStaff(id: number, staff: StaffDetailsRequest): Observable<StaffMutationResponse> {
    return this.http.put<StaffMutationResponse>(`${this.baseUrl}/${id}`, staff, {
      headers: this.authHeaders(),
    });
  }

  deleteStaff(id: number): Observable<StaffMutationResponse> {
    return this.http.delete<StaffMutationResponse>(`${this.baseUrl}/${id}`, {
      headers: this.authHeaders(),
    });
  }

  getOwnProfile(): Observable<{ staff: StaffMember }> {
    return this.http.get<{ staff: StaffMember }>(`${this.baseUrl}/me/profile`, {
      headers: this.authHeaders(),
    });
  }

  updateOwnProfile(staff: Omit<StaffDetailsRequest, 'role'>): Observable<StaffMutationResponse> {
    return this.http.put<StaffMutationResponse>(`${this.baseUrl}/me/profile`, staff, {
      headers: this.authHeaders(),
    });
  }

  private authHeaders(): HttpHeaders {
    const token = isPlatformBrowser(this.platformId)
      ? sessionStorage.getItem('carweb.token')
      : null;
    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
  }
}
