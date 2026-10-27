import type { Pool, RowDataPacket } from "mysql2/promise";
import { CAR_STATUS } from "../constants/carStatus.js";
import type { CarDetailDto, CarSummaryDto } from "../dtos/cars/CarDto.js";

export type CarDetailRecord = Omit<CarDetailDto, "isAvailable">;

export interface CarRepository {
  findAvailable(limit: number, offset: number): Promise<{ rows: CarSummaryDto[]; total: number }>;
  findById(id: number): Promise<CarDetailRecord | null>;
}

interface CarSummaryRow extends RowDataPacket {
  CarId: number;
  Brand: string;
  Model: string;
  YearOfCar: string;
  Mileage: number;
  SalePrice: string; // mysql2 returns DECIMAL as string
  PhotoUrl: string | null;
}

interface CarDetailRow extends RowDataPacket {
  CarId: number;
  Brand: string;
  Model: string;
  YearOfCar: string;
  VersionOfCar: string | null;
  Series: string | null;
  Mileage: number;
  FuelType: string | null;
  Transmission: string | null;
  Color: string;
  TireCondition: string;
  SalePrice: string;
  StatusOfCar: string;
}

interface PhotoRow extends RowDataPacket {
  PhotoId: number;
  PhotoUrl: string;
  IsMainPhoto: number | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export class MySqlCarRepository implements CarRepository {
  constructor(private readonly db: Pool) {}

  async findAvailable(limit: number, offset: number) {
    // Conditions are kept in a list so the brand/model filters (US-04) can be appended here.
    const conditions = ["c.StatusOfCar = ?", "c.InventoryStatus = TRUE"];
    const params: unknown[] = [CAR_STATUS.AVAILABLE];
    const where = conditions.join(" AND ");

    const [rows] = await this.db.query<CarSummaryRow[]>(
      `SELECT c.CarId, c.Brand, c.Model, c.YearOfCar, c.Mileage, c.SalePrice,
              (SELECT p.PhotoUrl FROM CarPhotos p
                WHERE p.CarId = c.CarId
                ORDER BY p.IsMainPhoto DESC, p.PhotoId ASC
                LIMIT 1) AS PhotoUrl
        FROM Cars c
        WHERE ${where}
        ORDER BY c.CarId DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const [countRows] = await this.db.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM Cars c WHERE ${where}`,
      params,
    );

    return {
      rows: rows.map((r) => ({
        id: r.CarId,
        brand: r.Brand,
        model: r.Model,
        year: Number(r.YearOfCar),
        mileage: r.Mileage,
        price: Number(r.SalePrice),
        photoUrl: r.PhotoUrl,
      })),
      total: Number(countRows[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<CarDetailRecord | null> {
    const [cars] = await this.db.query<CarDetailRow[]>(
      `SELECT CarId, Brand, Model, YearOfCar, VersionOfCar, Series, Mileage, FuelType,
              Transmission, Color, TireCondition, SalePrice, StatusOfCar
        FROM Cars
        WHERE CarId = ?`,
      [id],
    );
    const car = cars[0];
    if (!car) return null;

    const [photos] = await this.db.query<PhotoRow[]>(
      `SELECT PhotoId, PhotoUrl, IsMainPhoto
        FROM CarPhotos
        WHERE CarId = ?
        ORDER BY IsMainPhoto DESC, PhotoId ASC`,
      [id],
    );

    return {
      id: car.CarId,
      brand: car.Brand,
      model: car.Model,
      year: Number(car.YearOfCar),
      version: car.VersionOfCar,
      series: car.Series,
      mileage: car.Mileage,
      fuelType: car.FuelType,
      transmission: car.Transmission,
      color: car.Color,
      tireCondition: car.TireCondition,
      price: Number(car.SalePrice),
      status: car.StatusOfCar,
      photos: photos.map((p) => ({ id: p.PhotoId, url: p.PhotoUrl, isMain: Boolean(p.IsMainPhoto) })),
    };
  }
}
