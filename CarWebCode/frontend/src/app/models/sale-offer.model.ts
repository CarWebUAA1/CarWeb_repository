// Mirrors backend/src/controllers/SaleOffers.controller.ts and validators/carOffer.ts.

export const FUEL_TYPES = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'] as const;
export const TRANSMISSIONS = ['Manual', 'Automatic'] as const;

export type FuelType = (typeof FUEL_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];

/** The car data the customer offers (all required). */
export interface CarOffer {
  brand: string;
  model: string;
  year: number;
  version: string;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  color: string;
}

export interface EstimateResponse {
  estimatedPrice: number;
  /** "Estimated – subject to inspection" */
  label: string;
}

export interface CreateSaleOfferRequest extends CarOffer {
  appointmentId: number;
  token: string;
  vin: string;
  /** 3 to 5 "data:image/jpeg;base64,..." or "data:image/png;base64,..." */
  photos: string[];
  acceptEstimate: true;
}

export interface CreateSaleOfferResponse {
  message: string;
  tradeId: number;
  carId: number;
  status: string;
  estimatedPrice: number;
  label: string;
}

export interface UpdateListingPriceResponse {
  message: string;
  tradeId: number;
  previousPrice: number | null;
  listingPrice: number;
}
