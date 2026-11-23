import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ManagerTableData, ManagerTableKey } from '../models/manager-data.model';

@Injectable({ providedIn: 'root' })
export class ManagerDataService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl}/manager/data`;

  getTable(table: ManagerTableKey): Observable<ManagerTableData> {
    const token = isPlatformBrowser(this.platformId)
      ? sessionStorage.getItem('carweb.token')
      : null;
    return this.http.get<ManagerTableData>(`${this.baseUrl}/${table}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` }),
    });
  }
}
