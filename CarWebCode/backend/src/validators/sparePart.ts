import type {
  CreateSparePartDto,
  CreateStockMovementDto,
  StockMovementReason,
  StockMovementType,
} from "../dtos/spareParts/SparePartDto.js";
import { BadRequestError } from "../errors/HttpError.js";

export function parseCreateSparePart(
  body: unknown
): CreateSparePartDto {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new BadRequestError("Invalid spare part information");
  }

  const data = body as Record<string, unknown>;

  const brand =
    typeof data["brand"] === "string"
      ? data["brand"].trim()
      : "";

  const model =
    typeof data["model"] === "string"
      ? data["model"].trim()
      : "";

  const price = Number(data["price"]);

  const carId =
    data["carId"] === null ||
    data["carId"] === undefined ||
    data["carId"] === ""
      ? null
      : Number(data["carId"]);

  if (!brand || brand.length > 50) {
    throw new BadRequestError(
      "Brand is required and must have at most 50 characters"
    );
  }

  if (!model || model.length > 50) {
    throw new BadRequestError(
      "Model is required and must have at most 50 characters"
    );
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new BadRequestError("Price must be greater than zero");
  }

  if (
    carId !== null &&
    (!Number.isInteger(carId) || carId <= 0)
  ) {
    throw new BadRequestError("Invalid car ID");
  }

  return {
    carId,
    brand,
    model,
    price
  };
}

const MOVEMENT_REASONS: StockMovementReason[] = [
  "Purchase",
  "Sale",
  "Transfer",
  "Return",
  "Spare parts",
];

function isMovementType(value: unknown): value is StockMovementType {
  return value === "In" || value === "Out";
}

function isMovementReason(value: unknown): value is StockMovementReason {
  return MOVEMENT_REASONS.some((reason) => reason === value);
}

export function parseCreateStockMovement(
  body: unknown,
): CreateStockMovementDto {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BadRequestError("Invalid stock movement information");
  }

  const data = body as Record<string, unknown>;
  const movementType = data["movementType"];
  const reason = data["reason"];

  if (!isMovementType(movementType)) {
    throw new BadRequestError("Movement type must be In or Out");
  }
  if (!isMovementReason(reason)) {
    throw new BadRequestError("Invalid stock movement reason");
  }

  return {
    movementType: movementType as StockMovementType,
    reason: reason as StockMovementReason,
  };
}