export type SparePartStatus = "Available" | "Reserved" | "Sold";

export type InventoryStatus = "In stock" | "Out of stock";

export interface CreateSparePart {
  carId: number | null;
  brand: string;
  model: string;
  price: number;
}

export interface SparePart {
  id: number;
  carId: number | null;
  brand: string;
  model: string;
  status: SparePartStatus;
  price: number;
  inventoryStatus: InventoryStatus;
}

export interface PaginatedSpareParts {
  data: SparePart[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type StockMovementType = "In" | "Out";
export type StockMovementReason =
  | "Purchase"
  | "Sale"
  | "Transfer"
  | "Return"
  | "Spare parts";

export interface CreateStockMovement {
  movementType: StockMovementType;
  reason: StockMovementReason;
}

export interface CreateStockMovementResponse {
  message: string;
  data: {
    id: number;
    sparePartId: number;
    movementType: StockMovementType;
    reason: StockMovementReason;
    movementDate: string;
  };
}

export interface CreateSparePartResponse {
  message: string;
  data: SparePart;
}
