import { describe, expect, it } from "vitest";
import { readCarOffer, readVin } from "../src/validators/carOffer.js";
import { readPhoto } from "../src/utils/photo.util.js";

const car = {
  brand: "Toyota", model: "Corolla", year: 2020, version: "LE", mileage: 45000,
  fuelType: "Gasoline", transmission: "Automatic", color: "White",
};

//tiny files that start with the real JPG / PNG bytes
const jpg = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
const png = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64");

describe("readCarOffer", () => {
  it("accepts a complete car and trims the text", () => {
    expect(readCarOffer({ ...car, brand: "  Toyota " })).toEqual(car);
  });

  it("only accepts years between 1990 and the current year", () => {
    const currentYear = new Date().getFullYear();
    expect(readCarOffer({ ...car, year: 1990 })).toMatchObject({ year: 1990 });
    expect(readCarOffer({ ...car, year: currentYear })).toMatchObject({ year: currentYear });
    expect(readCarOffer({ ...car, year: 1989 })).toBe(`year must be between 1990 and ${currentYear}`);
    expect(readCarOffer({ ...car, year: currentYear + 1 })).toBe(`year must be between 1990 and ${currentYear}`);
  });

  it("only accepts a positive whole mileage", () => {
    expect(readCarOffer({ ...car, mileage: 0 })).toBe("mileage must be a positive whole number");
    expect(readCarOffer({ ...car, mileage: -5 })).toBe("mileage must be a positive whole number");
    expect(readCarOffer({ ...car, mileage: "45000" })).toBe("mileage must be a positive whole number");
  });

  it("asks for every field", () => {
    expect(readCarOffer({ ...car, version: "" })).toBe("version is required (max 50 characters)");
    expect(readCarOffer({ ...car, color: undefined })).toBe("color is required (max 30 characters)");
    expect(readCarOffer({ ...car, fuelType: "Gas" })).toContain("fuelType must be one of");
    expect(readCarOffer({ ...car, transmission: "CVT" })).toContain("transmission must be one of");
    expect(readCarOffer(undefined)).toBe("data is required");
  });
});

describe("readVin", () => {
  it("accepts 17 letters and numbers and returns it in capitals", () => {
    expect(readVin(" 3tmcz5an1lm000099 ")).toBe("3TMCZ5AN1LM000099");
  });

  it("rejects a short VIN or one with I, O or Q", () => {
    expect(readVin("ABC123")).toBeNull();
    expect(readVin("IOQ45678901234567")).toBeNull();
  });
});

describe("readPhoto", () => {
  it("accepts real JPG and PNG files", () => {
    expect(readPhoto(jpg)?.extension).toBe("jpg");
    expect(readPhoto(png)?.extension).toBe("png");
  });

  it("rejects a file that only says it is a JPG", () => {
    const fake = "data:image/jpeg;base64," + Buffer.from("not an image").toString("base64");
    expect(readPhoto(fake)).toBeNull();
  });

  it("rejects other formats and files over 5 MB", () => {
    const big = "data:image/jpeg;base64," +
      Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(5 * 1024 * 1024)]).toString("base64");
    expect(readPhoto(big)).toBeNull();
    expect(readPhoto("data:image/gif;base64,R0lGODlh")).toBeNull();
    expect(readPhoto(42)).toBeNull();
  });
});