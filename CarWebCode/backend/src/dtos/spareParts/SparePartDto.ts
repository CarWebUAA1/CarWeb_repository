export type SparePartStatus = "Available" | "Reserved" | "Sold";

export type InventoryStatus = "In stock" | "Out of stock";

export interface CreateSparePartDto {
  carId: number | null;
  brand: string;
  model: string;
  price: number;
}

export interface SparePartDto {
  id: number;
  carId: number | null;
  brand: string;
  model: string;
  status: SparePartStatus;
  price: number;
  inventoryStatus: InventoryStatus;
}

export type StockMovementType = "In" | "Out";
export type StockMovementReason =
  | "Purchase"
  | "Sale"
  | "Transfer"
  | "Return"
  | "Spare parts";

export interface CreateStockMovementDto {
  movementType: StockMovementType;
  reason: StockMovementReason;
}

export interface StockMovementDto extends CreateStockMovementDto {
  id: number;
  sparePartId: number;
  movementDate: string;
}

export interface PaginatedSparePartsDto {
  data: SparePartDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}