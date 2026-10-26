import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CarDetail, CarSummary, Paginated } from '../models/car.model';

@Injectable({ providedIn: 'root' })
export class CarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cars`;

  getCars(page: number): Observable<Paginated<CarSummary>> {
    return this.http.get<Paginated<CarSummary>>(this.baseUrl, { params: { page } });
  }

  /** Emits `null` when the car does not exist (404). */
  getCar(id: number): Observable<CarDetail | null> {
    return this.http.get<CarDetail>(`${this.baseUrl}/${id}`).pipe(
      catchError((err: unknown) =>
        err instanceof HttpErrorResponse && err.status === 404 ? of(null) : throwError(() => err),
      ),
    );
  }
}
