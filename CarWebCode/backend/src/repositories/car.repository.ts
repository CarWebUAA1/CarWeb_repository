import type { Pool, RowDataPacket } from "mysql2/promise";
import type { CarDetailDto, CarPhotoDto, CarSummaryDto } from "../dtos/cars/CarDto.js";
import { buildCatalogCondition, type CarFilters } from "./carFilters.js";

export type CarDetailRecord = Omit<CarDetailDto, "isAvailable">;

export interface CarRepository {
  findAvailable(
    filters: CarFilters,
    limit: number,
    offset: number,
  ): Promise<{ rows: CarSummaryDto[]; total: number }>;
  findById(id: number): Promise<CarDetailRecord | null>;
}

interface CarSummaryRow extends RowDataPacket {
  car_id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  sale_price: string; // mysql2 returns DECIMAL as string
  photo_url: string | null;
}

interface CarDetailRow extends RowDataPacket {
  car_id: number;
  brand: string;
  model: string;
  year: number;
  version: string | null;
  series: string | null;
  mileage: number;
  fuel_type: string;
  transmission: string;
  color: string;
  tire_condition: string | null;
  sale_price: string | null;
  status: string;
  photos: unknown; // JSON column, already parsed by mysql2
}

interface CountRow extends RowDataPacket {
  total: number;
}

/** cars.photos is a JSON list of URLs; the first one is the main photo. */
function toPhotos(value: unknown): CarPhotoDto[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .map((url, index) => ({ id: index + 1, url, isMain: index === 0 }));
}

export class MySqlCarRepository implements CarRepository {
  constructor(private readonly db: Pool) {}

  async findAvailable(filters: CarFilters, limit: number, offset: number) {
    const { where, params } = buildCatalogCondition(filters);

    const [rows] = await this.db.query<CarSummaryRow[]>(
      `SELECT c.car_id, c.brand, c.model, c.year, c.mileage, c.sale_price,
              JSON_UNQUOTE(JSON_EXTRACT(c.photos, '$[0]')) AS photo_url
        FROM cars c
        WHERE ${where}
        ORDER BY c.created_at DESC, c.car_id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const [countRows] = await this.db.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM cars c WHERE ${where}`,
      params,
    );

    return {
      rows: rows.map((r) => ({
        id: r.car_id,
        brand: r.brand,
        model: r.model,
        year: r.year,
        mileage: r.mileage,
        price: Number(r.sale_price),
        photoUrl: r.photo_url,
      })),
      total: Number(countRows[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<CarDetailRecord | null> {
    const [cars] = await this.db.query<CarDetailRow[]>(
      `SELECT car_id, brand, model, year, version, series, mileage, fuel_type,
              transmission, color, tire_condition, sale_price, status, photos
        FROM cars
        WHERE car_id = ?`,
      [id],
    );
    const car = cars[0];
    if (!car) return null;

    return {
      id: car.car_id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      version: car.version,
      series: car.series,
      mileage: car.mileage,
      fuelType: car.fuel_type,
      transmission: car.transmission,
      color: car.color,
      tireCondition: car.tire_condition,
      price: car.sale_price === null ? null : Number(car.sale_price),
      status: car.status,
      photos: toPhotos(car.photos),
    };
  }
}
