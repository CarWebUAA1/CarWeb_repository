import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  CreateSparePartDto,
  CreateStockMovementDto,
  SparePartDto,
  StockMovementDto,
} from "../dtos/spareParts/SparePartDto.js";
import { escapeLike } from "./carFilters.js";

interface CarRow extends RowDataPacket {
  car_id: number;
}

interface SparePartRow extends RowDataPacket {
  part_id: number;
  car_id: number | null;
  brand: string;
  model: string;
  status: SparePartDto["status"];
  price: string;
  inventory_status: SparePartDto["inventoryStatus"];
}

interface InventoryRow extends RowDataPacket {
  inventory_status: SparePartDto["inventoryStatus"];
}

export interface SparePartRepository {
  create(data: CreateSparePartDto): Promise<SparePartDto>;
  findAvailable(
    search: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ rows: SparePartDto[]; total: number }>;
  findById(id: number): Promise<SparePartDto | null>;
  createStockMovement(
    sparePartId: number,
    staffId: number,
    staffRole: "Employee" | "Manager",
    data: CreateStockMovementDto,
  ): Promise<StockMovementDto>;
}

export class MySqlSparePartRepository
  implements SparePartRepository {

  constructor(private readonly db: Pool) {}

  async findAvailable(search: string | undefined, limit: number, offset: number) {
    const where = search ? "WHERE brand LIKE ? OR model LIKE ?" : "";
    const escapedSearch = search ? escapeLike(search) : undefined;
    const params = escapedSearch ? [`%${escapedSearch}%`, `%${escapedSearch}%`] : [];
    const [rows] = await this.db.query<SparePartRow[]>(
      `SELECT part_id, car_id, brand, model, status, price, inventory_status
         FROM spare_parts
         ${where}
        ORDER BY created_at DESC, part_id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const [countRows] = await this.db.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM spare_parts ${where}`,
      params,
    );

    return {
      rows: rows.map((row) => this.toDto(row)),
      total: Number(countRows[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<SparePartDto | null> {
    const [rows] = await this.db.query<SparePartRow[]>(
      `SELECT part_id, car_id, brand, model, status, price, inventory_status
         FROM spare_parts
        WHERE part_id = ?`,
      [id],
    );
    return rows[0] ? this.toDto(rows[0]) : null;
  }

  async create(data: CreateSparePartDto): Promise<SparePartDto> {

    if (data.carId !== null) {
      const [cars] = await this.db.query<CarRow[]>(
        "SELECT car_id FROM cars WHERE car_id = ?",
        [data.carId]
      );

      if (cars.length === 0) {
        throw new Error("CAR_NOT_FOUND");
      }
    }

    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO spare_parts
        (car_id, brand, model, price)
       VALUES (?, ?, ?, ?)`,
      [
        data.carId,
        data.brand,
        data.model,
        data.price,
      ]
    );

    return {
      id: result.insertId,
      carId: data.carId,
      brand: data.brand,
      model: data.model,
      status: "Available",
      price: data.price,
      inventoryStatus: "In stock"
    };
  }

  async createStockMovement(
    sparePartId: number,
    staffId: number,
    staffRole: "Employee" | "Manager",
    data: CreateStockMovementDto,
  ): Promise<StockMovementDto> {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const [parts] = await connection.query<InventoryRow[]>(
        "SELECT inventory_status FROM spare_parts WHERE part_id = ? FOR UPDATE",
        [sparePartId],
      );
      const part = parts[0];
      if (!part) throw new Error("PART_NOT_FOUND");

      const expectedStatus = data.movementType === "In" ? "Out of stock" : "In stock";
      if (part.inventory_status !== expectedStatus) {
        throw new Error("MOVEMENT_CONFLICT");
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO stock_movements
          (car_id, spare_part_id, staff_id, staff_role, movement_type, reason)
         VALUES (NULL, ?, ?, ?, ?, ?)`,
        [sparePartId, staffId, staffRole, data.movementType, data.reason],
      );
      const newStatus = data.movementType === "In" ? "In stock" : "Out of stock";
      await connection.execute(
        "UPDATE spare_parts SET inventory_status = ? WHERE part_id = ?",
        [newStatus, sparePartId],
      );
      await connection.commit();

      return {
        id: result.insertId,
        sparePartId,
        ...data,
        movementDate: new Date().toISOString(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private toDto(row: SparePartRow): SparePartDto {
    return {
      id: row.part_id,
      carId: row.car_id,
      brand: row.brand,
      model: row.model,
      status: row.status,
      price: Number(row.price),
      inventoryStatus: row.inventory_status,
    };
  }
}