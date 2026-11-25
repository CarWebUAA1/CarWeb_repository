// Mirrors backend/src/controllers/Cars.Controller.ts and validators/inventoryCar.ts.
import type { FuelType, Transmission } from './sale-offer.model';

export const CAR_STATUSES = [
  'Available',
  'Reserved',
  'Sold',
  'In test drive',
  'Out of service',
  'Pending evaluation',
  'Spare parts',
] as const;
export const TIRE_CONDITIONS = ['Good', 'Fair', 'Poor'] as const;

export type CarStatus = (typeof CAR_STATUSES)[number];
export type TireCondition = (typeof TIRE_CONDITIONS)[number];

/** What the manager sends to create or update a car. */
export interface InventoryCarRequest {
  vin: string;
  plates: string | null;
  brand: string;
  model: string;
  year: number;
  version: string | null;
  series: string | null;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  color: string;
  tireCondition: TireCondition | null;
  serviceHistory: string | null;
  purchasePrice: number;
  basePrice: number | null;
  salePrice: number;
  testDriveAuthorized: boolean;
  status: CarStatus;
  /** Needed when salePrice < purchasePrice. */
  confirmLowerSalePrice?: boolean;
}

export interface InventoryCar
  extends Omit<InventoryCarRequest, 'confirmLowerSalePrice' | 'purchasePrice' | 'salePrice'> {
  carId: number;
  purchasePrice: number | null;
  salePrice: number | null;
  photos: string[];
  inventoryStatus: 'In stock' | 'Out of stock';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMutationResponse {
  message: string;
  carId?: number;
}
