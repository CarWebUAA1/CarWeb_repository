// Shapes returned by the /cars endpoints. Internal fields (VIN, plates,
// purchase price) are never part of a public response.

export interface CarSummaryDto {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  photoUrl: string | null;
}

export interface CarPhotoDto {
  id: number;
  url: string;
  isMain: boolean;
}

export interface CarDetailDto {
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
  photos: CarPhotoDto[];
}

export interface PaginatedDto<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
