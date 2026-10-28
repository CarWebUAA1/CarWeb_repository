import { CAR_STATUS } from "../constants/carStatus.js";
import type { CarDetailDto, CarSummaryDto, PaginatedDto } from "../dtos/cars/CarDto.js";
import { NotFoundError } from "../errors/HttpError.js";
import type { CarRepository } from "../repositories/car.repository.js";

export const CATALOG_PAGE_SIZE = 20;

export class CarService {
  constructor(private readonly repository: CarRepository) {}

  async listAvailable(page: number): Promise<PaginatedDto<CarSummaryDto>> {
    const offset = (page - 1) * CATALOG_PAGE_SIZE;
    const { rows, total } = await this.repository.findAvailable(CATALOG_PAGE_SIZE, offset);
    return {
      data: rows,
      page,
      pageSize: CATALOG_PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / CATALOG_PAGE_SIZE),
    };
  }

  // Returns the car whatever its status: the page uses `isAvailable` to warn
  // a user who opened it before it was sold or reserved.
  async getById(id: number): Promise<CarDetailDto> {
    const car = await this.repository.findById(id);
    if (!car) throw new NotFoundError("Car not found");
    return { ...car, isAvailable: car.status === CAR_STATUS.AVAILABLE };
  }
}
