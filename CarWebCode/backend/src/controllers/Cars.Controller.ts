import type { Request, Response } from "express";
import { pool } from "../conf/dbConnection.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { readInventoryCar, readPrice } from "../validators/inventoryCar.js";

// Inventory management (RegisterAndUpdateInventory). Only managers reach these
// handlers: see routes/Cars.routes.ts.

const INVENTORY_COLUMNS = `car_id, vin, plates, brand, model, year, version, series, mileage, fuel_type,
    transmission, color, status, tire_condition, service_history, purchase_price, base_price, sale_price,
    test_drive_authorized, photos, inventory_status,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
    DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at`;

const toNumber = (value: unknown) => (value === null || value === undefined ? null : Number(value));

function toPhotos(value: unknown): string[] {
    const list = typeof value === "string" ? safeParse(value) : value;
    return Array.isArray(list) ? list.filter((url): url is string => typeof url === "string" && url.length > 0) : [];
}

function safeParse(text: string): unknown {
    try { return JSON.parse(text); } catch { return []; }
}

/** cars row (snake_case) -> API (camelCase), the same style as the rest of the API. */
export function toInventoryCar(row: RowDataPacket) {
    return {
        carId: row["car_id"],
        vin: row["vin"],
        plates: row["plates"],
        brand: row["brand"],
        model: row["model"],
        year: row["year"],
        version: row["version"],
        series: row["series"],
        mileage: row["mileage"],
        fuelType: row["fuel_type"],
        transmission: row["transmission"],
        color: row["color"],
        status: row["status"],
        tireCondition: row["tire_condition"],
        serviceHistory: row["service_history"],
        purchasePrice: toNumber(row["purchase_price"]),
        basePrice: toNumber(row["base_price"]),
        salePrice: toNumber(row["sale_price"]),
        testDriveAuthorized: Boolean(row["test_drive_authorized"]),
        photos: toPhotos(row["photos"]),
        inventoryStatus: row["inventory_status"],
        createdAt: row["created_at"],
        updatedAt: row["updated_at"],
    };
}

function readId(req: Request, res: Response): number | null {
    const id = Number(req.params["id"]);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: "this id is not valid" });
        return null;
    }
    return id;
}

/** A car with an active purchase or sale cannot be deleted or change its status. */
async function hasOperationInProgress(carId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        "select trade_id from trades where car_id = ? and is_active = TRUE limit 1",
        [carId],
    );
    return rows.length > 0;
}

const isDuplicate = (error: unknown) => (error as { code?: string }).code === "ER_DUP_ENTRY";
const DUPLICATE_MESSAGE = "a car with this VIN or these plates is already registered";

export class CarsController {
    constructor() {}

    // GET /cars/getAllCars?includeOutOfStock=true
    // Every car in stock, whatever its status (the public catalog only shows "Available" ones).
    public async getAllCars(req: Request, res: Response) {
        try {
            const includeOutOfStock = req.query["includeOutOfStock"] === "true";
            const [cars] = await pool.execute<RowDataPacket[]>(
                `select ${INVENTORY_COLUMNS} from cars ${includeOutOfStock ? "" : "where inventory_status = 'In stock'"} order by created_at desc, car_id desc`,
            );
            res.json(cars.map(toInventoryCar));
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    }

    // GET /cars/getCarsById/:id
    public async getCarsById(req: Request, res: Response) {
        const id = readId(req, res);
        if (id === null) return;
        try {
            const [cars] = await pool.execute<RowDataPacket[]>(
                `select ${INVENTORY_COLUMNS} from cars where car_id = ?`,
                [id],
            );
            if (!cars[0]) {
                res.status(404).json({ message: "the car could not be found" });
                return;
            }
            res.json(toInventoryCar(cars[0]));
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    }

    // POST /cars/createCar
    // Body: { vin, brand, model, year, mileage, fuelType, transmission, color, purchasePrice, salePrice, ... }
    public async createCar(req: Request, res: Response) {
        const car = readInventoryCar(req.body);
        if (typeof car === "string") {
            res.status(400).json({ message: car });
            return;
        }
        try {
            const [result] = await pool.execute<ResultSetHeader>(
                `insert into cars (vin, plates, brand, model, year, version, series, mileage, fuel_type, transmission, color,
                    status, tire_condition, service_history, purchase_price, base_price, sale_price, test_drive_authorized)
                 values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [car.vin, car.plates, car.brand, car.model, car.year, car.version, car.series, car.mileage,
                    car.fuelType, car.transmission, car.color, car.status, car.tireCondition, car.serviceHistory,
                    car.purchasePrice, car.basePrice, car.salePrice, car.testDriveAuthorized],
            );
            res.status(201).json({ message: "car has been created", carId: result.insertId });
        } catch (error) {
            if (isDuplicate(error)) {
                res.status(409).json({ message: DUPLICATE_MESSAGE });
                return;
            }
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    }

    // PUT /cars/updateCar/:id
    // Body: the same fields as createCar (all of them: it replaces the car's data).
    public async updateCar(req: Request, res: Response) {
        const id = readId(req, res);
        if (id === null) return;
        const car = readInventoryCar(req.body);
        if (typeof car === "string") {
            res.status(400).json({ message: car });
            return;
        }
        try {
            const [current] = await pool.execute<RowDataPacket[]>(
                "select status from cars where car_id = ? and inventory_status = 'In stock'",
                [id],
            );
            if (!current[0]) {
                res.status(404).json({ message: "the car could not be found" });
                return;
            }
            if (current[0]["status"] !== car.status && await hasOperationInProgress(id)) {
                res.status(409).json({ message: "the status cannot change while the car has an operation in progress" });
                return;
            }

            await pool.execute(
                `update cars set vin = ?, plates = ?, brand = ?, model = ?, year = ?, version = ?, series = ?, mileage = ?,
                    fuel_type = ?, transmission = ?, color = ?, status = ?, tire_condition = ?, service_history = ?,
                    purchase_price = ?, base_price = ?, sale_price = ?, test_drive_authorized = ?
                 where car_id = ?`,
                [car.vin, car.plates, car.brand, car.model, car.year, car.version, car.series, car.mileage,
                    car.fuelType, car.transmission, car.color, car.status, car.tireCondition, car.serviceHistory,
                    car.purchasePrice, car.basePrice, car.salePrice, car.testDriveAuthorized, id],
            );
            res.status(200).json({ message: "car has been updated" });
        } catch (error) {
            if (isDuplicate(error)) {
                res.status(409).json({ message: DUPLICATE_MESSAGE });
                return;
            }
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    }

    // PATCH /cars/updatePrice/:id
    // Body: { "salePrice": 250000, "confirmLowerSalePrice": false }
    public async updatePrice(req: Request, res: Response) {
        const id = readId(req, res);
        if (id === null) return;

        const { salePrice, confirmLowerSalePrice } = req.body ?? {};
        const price = readPrice(salePrice);
        if (price === null) {
            res.status(400).json({ message: "salePrice must be greater than 0 with up to 2 decimals" });
            return;
        }
        try {
            const [cars] = await pool.execute<RowDataPacket[]>(
                "select purchase_price from cars where car_id = ? and inventory_status = 'In stock'",
                [id],
            );
            if (!cars[0]) {
                res.status(404).json({ message: "the car could not be found" });
                return;
            }
            const purchasePrice = toNumber(cars[0]["purchase_price"]);
            if (purchasePrice !== null && price < purchasePrice && confirmLowerSalePrice !== true) {
                res.status(400).json({ message: "the sale price is lower than the purchase price, confirm it to continue" });
                return;
            }

            await pool.execute("update cars set sale_price = ? where car_id = ?", [price, id]);
            res.status(200).json({ message: "sale price has been updated", salePrice: price });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    }

    // DELETE /cars/deleteCar/:id
    // Soft delete: the car leaves the inventory ("Out of stock") but its history stays.
    public async deleteCar(req: Request, res: Response) {
        const id = readId(req, res);
        if (id === null) return;
        try {
            if (await hasOperationInProgress(id)) {
                res.status(409).json({ message: "the car cannot be deleted while it has an operation in progress" });
                return;
            }
            const [result] = await pool.execute<ResultSetHeader>(
                "update cars set inventory_status = 'Out of stock' where car_id = ? and inventory_status = 'In stock'",
                [id],
            );
            if (result.affectedRows === 0) {
                res.status(404).json({ message: "the car could not be found" });
                return;
            }
            res.status(200).json({ message: "car has been deleted" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    }

    // GET /cars/filterCars?brand=Toyota&model=Corolla (public)
    public async filterCars(req: Request, res: Response) {
        try {
            const brand = typeof req.query["brand"] === "string" ? req.query["brand"].trim() : "";
            const model = typeof req.query["model"] === "string" ? req.query["model"].trim() : "";

            // only the filters that were sent go into the query
            const conditions = ["status = 'Available'", "inventory_status = 'In stock'", "sale_price is not null"];
            const params: string[] = [];
            if (brand) { conditions.push("brand = ?"); params.push(brand); }
            if (model) { conditions.push("model = ?"); params.push(model); }

            const [cars] = await pool.execute<RowDataPacket[]>(
                `select car_id, brand, model, year, version, mileage, color, sale_price, photos from cars where ${conditions.join(" and ")}`,
                params,
            );
            if (!cars[0]) {
                res.status(404).json({ message: "No cars match your search", cars: [] });
                return;
            }
            res.json({ cars });
        } catch {
            res.status(500).json({ message: "internal server error" });
        }
    }
}
