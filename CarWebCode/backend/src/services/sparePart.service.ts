import {
  ConflictError,
  NotFoundError
} from "../errors/HttpError.js";

import type {
  CreateSparePartDto,
  CreateStockMovementDto,
  PaginatedSparePartsDto,
  SparePartDto
} from "../dtos/spareParts/SparePartDto.js";

import type {
  SparePartRepository
} from "../repositories/sparePart.repository.js";

export const SPARE_PARTS_PAGE_SIZE = 20;

export class SparePartService {
  constructor(
    private readonly repository: SparePartRepository
  ) {}

  async create(data: CreateSparePartDto): Promise<SparePartDto> {
    try {
      return await this.repository.create(data);
    } catch (error) {
      if (error instanceof Error && error.message === "CAR_NOT_FOUND") {
        throw new NotFoundError("Car not found");
      }

      throw error;
    }
  }

  async list(page: number, search?: string): Promise<PaginatedSparePartsDto> {
    const offset = (page - 1) * SPARE_PARTS_PAGE_SIZE;
    const { rows, total } = await this.repository.findAvailable(
      search,
      SPARE_PARTS_PAGE_SIZE,
      offset,
    );
    return {
      data: rows,
      page,
      pageSize: SPARE_PARTS_PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / SPARE_PARTS_PAGE_SIZE),
    };
  }

  async getById(id: number): Promise<SparePartDto> {
    const part = await this.repository.findById(id);
    if (!part) throw new NotFoundError("Spare part not found");
    return part;
  }

  async createStockMovement(
    sparePartId: number,
    staffId: number,
    staffRole: "Employee" | "Manager",
    data: CreateStockMovementDto,
  ) {
    try {
      return await this.repository.createStockMovement(sparePartId, staffId, staffRole, data);
    } catch (error) {
      if (error instanceof Error && error.message === "PART_NOT_FOUND") {
        throw new NotFoundError("Spare part not found");
      }
      if (error instanceof Error && error.message === "MOVEMENT_CONFLICT") {
        throw new ConflictError("The spare part stock already has this status");
      }
      throw error;
    }
  }
}