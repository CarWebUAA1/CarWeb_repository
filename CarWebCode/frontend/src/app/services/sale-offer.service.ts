import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CarOffer,
  CreateSaleOfferRequest,
  CreateSaleOfferResponse,
  EstimateResponse,
  UpdateListingPriceResponse,
} from '../models/sale-offer.model';

/** Offer my car for sale (US-19). Customers have no account: the manage-link token identifies them. */
@Injectable({ providedIn: 'root' })
export class SaleOfferService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sale-offers`;

  /** Only shows the estimate; nothing is saved. 422 when the car cannot be estimated online. */
  estimate(car: CarOffer): Observable<EstimateResponse> {
    return this.http.post<EstimateResponse>(`${this.baseUrl}/estimate`, car);
  }

  create(offer: CreateSaleOfferRequest): Observable<CreateSaleOfferResponse> {
    return this.http.post<CreateSaleOfferResponse>(this.baseUrl, offer);
  }

  /** At most 10% above the estimate, once every 24 hours. */
  updateListingPrice(tradeId: number, token: string, listingPrice: number): Observable<UpdateListingPriceResponse> {
    return this.http.patch<UpdateListingPriceResponse>(`${this.baseUrl}/${tradeId}/listing-price`, {
      token,
      listingPrice,
    });
  }
}
