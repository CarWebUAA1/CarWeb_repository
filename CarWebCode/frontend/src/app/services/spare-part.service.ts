import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from "../../environments/environment";

import {
  CreateStockMovement,
  CreateSparePart,
  CreateSparePartResponse,
  CreateStockMovementResponse,
  PaginatedSpareParts,
  SparePart,
} from "../models/spare-part.model";

import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root"
})
export class SparePartService {

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly baseUrl =
    `${environment.apiUrl}/spare-parts`;

  getSpareParts(page: number, search?: string): Observable<PaginatedSpareParts> {
    const params: Record<string, string | number> = { page };
    if (search) params["search"] = search;
    return this.http.get<PaginatedSpareParts>(this.baseUrl, { params });
  }

  getSparePart(id: number): Observable<SparePart> {
    return this.http.get<SparePart>(`${this.baseUrl}/${id}`);
  }

  createStockMovement(
    id: number,
    movement: CreateStockMovement,
  ): Observable<CreateStockMovementResponse> {
    const token = this.auth.token();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ""}`,
    });
    return this.http.post<CreateStockMovementResponse>(
      `${this.baseUrl}/${id}/stock-movements`,
      movement,
      { headers },
    );
  }

  createSparePart(
    sparePart: CreateSparePart
  ): Observable<CreateSparePartResponse> {

    const token = this.auth.token();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ""}`
    });

    return this.http.post<CreateSparePartResponse>(
      this.baseUrl,
      sparePart,
      { headers }
    );
  }
}
