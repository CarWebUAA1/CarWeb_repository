import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  InventoryCar,
  InventoryCarRequest,
  InventoryMutationResponse,
} from '../models/inventory.model';
import { AuthService } from './auth.service';

/** Car inventory for managers (RegisterAndUpdateInventory). Every call needs a manager session. */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/cars`;

  list(includeOutOfStock = false): Observable<InventoryCar[]> {
    return this.http.get<InventoryCar[]>(`${this.baseUrl}/getAllCars`, {
      headers: this.headers(),
      params: includeOutOfStock ? { includeOutOfStock: 'true' } : {},
    });
  }

  create(car: InventoryCarRequest): Observable<InventoryMutationResponse> {
    return this.http.post<InventoryMutationResponse>(`${this.baseUrl}/createCar`, car, { headers: this.headers() });
  }

  update(id: number, car: InventoryCarRequest): Observable<InventoryMutationResponse> {
    return this.http.put<InventoryMutationResponse>(`${this.baseUrl}/updateCar/${id}`, car, { headers: this.headers() });
  }

  updatePrice(id: number, salePrice: number, confirmLowerSalePrice = false): Observable<InventoryMutationResponse> {
    return this.http.patch<InventoryMutationResponse>(
      `${this.baseUrl}/updatePrice/${id}`,
      { salePrice, confirmLowerSalePrice },
      { headers: this.headers() },
    );
  }

  /** Soft delete: the car is marked "Out of stock". */
  remove(id: number): Observable<InventoryMutationResponse> {
    return this.http.delete<InventoryMutationResponse>(`${this.baseUrl}/deleteCar/${id}`, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token() ?? ''}` });
  }
}
