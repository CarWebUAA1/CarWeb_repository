import { CAR_STATUS, type CarStatus } from "../constants/carStatus.js";
import { readVin } from "./carOffer.js";

// Values allowed by the cars table (ENUM in sql/schema.sql)
export const FUEL_TYPES = ["Gasoline", "Diesel", "Hybrid", "Electric"] as const;
export const TRANSMISSIONS = ["Manual", "Automatic"] as const;
export const TIRE_CONDITIONS = ["Good", "Fair", "Poor"] as const;
export const CAR_STATUSES = Object.values(CAR_STATUS) as CarStatus[];
const MAX_MILEAGE = 1000000;
const MAX_PRICE = 9999999999.99; // DECIMAL(12,2)

/** A car as the manager registers or edits it (RegisterAndUpdateInventory). */
export interface InventoryCarInput {
    vin: string;
    plates: string | null;
    brand: string;
    model: string;
    year: number;
    version: string | null;
    series: string | null;
    mileage: number;
    fuelType: string;
    transmission: string;
    color: string;
    tireCondition: string | null;
    serviceHistory: string | null;
    purchasePrice: number;
    basePrice: number | null;
    salePrice: number;
    testDriveAuthorized: boolean;
    status: CarStatus;
}

function readText(value: unknown, maxLength: number): string | null {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) return null;
    return value.trim();
}

/** Optional text: undefined/null/blank -> null, too long -> error. */
function readOptionalText(value: unknown, maxLength: number, field: string): string | null | Error {
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) return null;
    const text = readText(value, maxLength);
    return text ?? new Error(`${field} must be a text of at most ${maxLength} characters`);
}

/** Price > 0 with up to 2 decimals. */
export function readPrice(value: unknown): number | null {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > MAX_PRICE) return null;
    if (Math.round(value * 100) / 100 !== value) return null;
    return value;
}

/**
 * Checks the car sent by the manager. Returns the clean data or the error message.
 * `confirmLowerSalePrice: true` lets the sale price be lower than the purchase price.
 */
export function readInventoryCar(body: unknown): InventoryCarInput | string {
    if (!body || typeof body !== "object") return "data is required";
    const data = body as Record<string, unknown>;

    const vin = readVin(data["vin"]);
    if (!vin) return "vin must have 17 letters and numbers (without I, O or Q)";

    const plates = readOptionalText(data["plates"], 10, "plates");
    if (plates instanceof Error) return plates.message;

    const brand = readText(data["brand"], 50);
    if (!brand) return "brand is required (max 50 characters)";

    const model = readText(data["model"], 50);
    if (!model) return "model is required (max 50 characters)";

    // a dealership can receive next year's model before the year starts
    const maxYear = new Date().getFullYear() + 1;
    const year = data["year"];
    if (typeof year !== "number" || !Number.isInteger(year) || year < 1990 || year > maxYear) {
        return `year must be between 1990 and ${maxYear}`;
    }

    const version = readOptionalText(data["version"], 50, "version");
    if (version instanceof Error) return version.message;

    const series = readOptionalText(data["series"], 50, "series");
    if (series instanceof Error) return series.message;

    const mileage = data["mileage"];
    if (typeof mileage !== "number" || !Number.isInteger(mileage) || mileage < 0 || mileage > MAX_MILEAGE) {
        return "mileage must be a whole number of 0 or more";
    }

    const fuelType = data["fuelType"];
    if (typeof fuelType !== "string" || !(FUEL_TYPES as readonly string[]).includes(fuelType)) {
        return `fuelType must be one of: ${FUEL_TYPES.join(", ")}`;
    }

    const transmission = data["transmission"];
    if (typeof transmission !== "string" || !(TRANSMISSIONS as readonly string[]).includes(transmission)) {
        return `transmission must be one of: ${TRANSMISSIONS.join(", ")}`;
    }

    const color = readText(data["color"], 30);
    if (!color) return "color is required (max 30 characters)";

    const tire = data["tireCondition"];
    let tireCondition: string | null = null;
    if (tire !== undefined && tire !== null && tire !== "") {
        if (typeof tire !== "string" || !(TIRE_CONDITIONS as readonly string[]).includes(tire)) {
            return `tireCondition must be one of: ${TIRE_CONDITIONS.join(", ")}`;
        }
        tireCondition = tire;
    }

    const serviceHistory = readOptionalText(data["serviceHistory"], 5000, "serviceHistory");
    if (serviceHistory instanceof Error) return serviceHistory.message;

    const purchasePrice = readPrice(data["purchasePrice"]);
    if (purchasePrice === null) return "purchasePrice must be greater than 0 with up to 2 decimals";

    let basePrice: number | null = null;
    if (data["basePrice"] !== undefined && data["basePrice"] !== null) {
        basePrice = readPrice(data["basePrice"]);
        if (basePrice === null) return "basePrice must be greater than 0 with up to 2 decimals";
    }

    const salePrice = readPrice(data["salePrice"]);
    if (salePrice === null) return "salePrice must be greater than 0 with up to 2 decimals";

    if (salePrice < purchasePrice && data["confirmLowerSalePrice"] !== true) {
        return "the sale price is lower than the purchase price, confirm it to continue";
    }

    const testDriveAuthorized = data["testDriveAuthorized"] ?? true;
    if (typeof testDriveAuthorized !== "boolean") return "testDriveAuthorized must be true or false";

    const status = data["status"] ?? CAR_STATUS.AVAILABLE;
    if (typeof status !== "string" || !CAR_STATUSES.includes(status as CarStatus)) {
        return `status must be one of: ${CAR_STATUSES.join(", ")}`;
    }

    return {
        vin, plates, brand, model, year, version, series, mileage, fuelType, transmission, color,
        tireCondition, serviceHistory, purchasePrice, basePrice, salePrice, testDriveAuthorized,
        status: status as CarStatus,
    };
}
