// Mirrors the backend DTOs in backend/src/dtos/cars/CarDto.ts.

export interface CarSummary {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  photoUrl: string | null;
}

export interface CarPhoto {
  id: number;
  url: string;
  isMain: boolean;
}

export interface ServiceRecord {
  date: string;
  mileage: number | null;
  description: string;
}

export interface CarDetail {
  id: number;
  brand: string;
  model: string;
  year: number;
  version: string | null;
  series: string | null;
  mileage: number;
  fuelType: string | null;
  transmission: string | null;
  color: string;
  tireCondition: string;
  price: number;
  status: string;
  isAvailable: boolean;
  photos: CarPhoto[];
  serviceHistory: ServiceRecord[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
