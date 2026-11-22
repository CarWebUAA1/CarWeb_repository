// Values allowed by the cars table (ENUM in sql/schema.sql)
const FUEL_TYPES = ["Gasoline", "Diesel", "Hybrid", "Electric"];
const TRANSMISSIONS = ["Manual", "Automatic"];
const MAX_MILEAGE = 1000000;

export interface CarOffer {
    brand: string;
    model: string;
    year: number;
    version: string;
    mileage: number;
    fuelType: string;
    transmission: string;
    color: string;
}

// required text, trimmed, with a max length (the size of the column)
function readText(value: unknown, maxLength: number): string | null {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) return null;
    return value.trim();
}

// Checks the car data. Returns the clean data, or the error message as a string.
export function readCarOffer(body: unknown): CarOffer | string {
    if (!body || typeof body !== "object") return "data is required";
    const { brand, model, year, version, mileage, fuelType, transmission, color } = body as Record<string, unknown>;

    const cleanBrand = readText(brand, 50);
    if (!cleanBrand) return "brand is required (max 50 characters)";

    const cleanModel = readText(model, 50);
    if (!cleanModel) return "model is required (max 50 characters)";

    const currentYear = new Date().getFullYear();
    if (typeof year !== "number" || !Number.isInteger(year) || year < 1990 || year > currentYear) {
        return `year must be between 1990 and ${currentYear}`;
    }

    const cleanVersion = readText(version, 50);
    if (!cleanVersion) return "version is required (max 50 characters)";

    if (typeof mileage !== "number" || !Number.isInteger(mileage) || mileage <= 0 || mileage > MAX_MILEAGE) {
        return "mileage must be a positive whole number";
    }

    if (typeof fuelType !== "string" || !FUEL_TYPES.includes(fuelType)) {
        return `fuelType must be one of: ${FUEL_TYPES.join(", ")}`;
    }

    if (typeof transmission !== "string" || !TRANSMISSIONS.includes(transmission)) {
        return `transmission must be one of: ${TRANSMISSIONS.join(", ")}`;
    }

    const cleanColor = readText(color, 30);
    if (!cleanColor) return "color is required (max 30 characters)";

    return {
        brand: cleanBrand,
        model: cleanModel,
        year,
        version: cleanVersion,
        mileage,
        fuelType,
        transmission,
        color: cleanColor,
    };
}

// The cars table needs the VIN: 17 letters and numbers, without I, O or Q. Returns null if it is not valid.
export function readVin(vin: unknown): string | null {
    if (typeof vin !== "string" || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim())) return null;
    return vin.trim().toUpperCase();
}