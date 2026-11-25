import { Router } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../src/conf/dbConnection.js";
import CarsRoutes from "../src/routes/Cars.routes.js";
import { Server } from "../src/server.js";

vi.mock("../src/conf/dbConnection.js", () => ({
  pool: { execute: vi.fn() },
}));

const secret = "inventory-test-secret";
const bearer = (role: string) => `Bearer ${jwt.sign({ role }, secret, { subject: "1" })}`;
const OK = [{ affectedRows: 1, insertId: 31 }, []];

const car = {
  vin: "1HGCM82633A004352",
  brand: "Honda",
  model: "Civic",
  year: 2022,
  mileage: 15000,
  fuelType: "Gasoline",
  transmission: "Automatic",
  color: "Blue",
  purchasePrice: 250000,
  salePrice: 290000,
};

describe("Inventory API (RegisterAndUpdateInventory)", () => {
  let app: Server["server"];

  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", secret);
    vi.mocked(pool.execute).mockReset();
    const routes = Router();
    routes.use("/cars", CarsRoutes);
    app = new Server({ port: 0, routes }).server;
  });

  afterEach(() => vi.unstubAllEnvs());

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/v1/cars/getAllCars");
    expect(res.status).toBe(401);
  });

  it("rejects employees: only managers change the inventory", async () => {
    const res = await request(app).post("/api/v1/cars/createCar").set("Authorization", bearer("employee")).send(car);
    expect(res.status).toBe(403);
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("lists the cars in stock in camelCase", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce([[{
      car_id: 1, vin: car.vin, brand: "Honda", model: "Civic", year: 2022, fuel_type: "Gasoline",
      status: "Available", purchase_price: "250000.00", sale_price: "290000.00", base_price: null,
      test_drive_authorized: 1, photos: '["/a.jpg"]', inventory_status: "In stock",
    }], []] as never);

    const res = await request(app).get("/api/v1/cars/getAllCars").set("Authorization", bearer("manager"));

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      carId: 1, fuelType: "Gasoline", purchasePrice: 250000, salePrice: 290000, basePrice: null,
      testDriveAuthorized: true, photos: ["/a.jpg"],
    });
    expect(vi.mocked(pool.execute).mock.calls[0]?.[0]).toContain("inventory_status = 'In stock'");
  });

  it("creates a car as Available", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(OK as never);

    const res = await request(app).post("/api/v1/cars/createCar").set("Authorization", bearer("manager")).send(car);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: "car has been created", carId: 31 });
    expect(vi.mocked(pool.execute).mock.calls[0]?.[1]).toContain("Available");
  });

  it("asks for confirmation when the sale price is lower than the purchase price", async () => {
    const lower = { ...car, salePrice: 200000 };
    const auth = bearer("manager");

    const rejected = await request(app).post("/api/v1/cars/createCar").set("Authorization", auth).send(lower);
    expect(rejected.status).toBe(400);
    expect(pool.execute).not.toHaveBeenCalled();

    vi.mocked(pool.execute).mockResolvedValueOnce(OK as never);
    const accepted = await request(app).post("/api/v1/cars/createCar").set("Authorization", auth)
      .send({ ...lower, confirmLowerSalePrice: true });
    expect(accepted.status).toBe(201);
  });

  it.each([
    ["a missing brand", { brand: "" }],
    ["a zero purchase price", { purchasePrice: 0 }],
    ["a year before 1990", { year: 1985 }],
    ["an invalid VIN", { vin: "123" }],
  ])("rejects %s", async (_label, change) => {
    const res = await request(app).post("/api/v1/cars/createCar").set("Authorization", bearer("manager"))
      .send({ ...car, ...change });
    expect(res.status).toBe(400);
  });

  it("returns 409 for a VIN that is already registered", async () => {
    vi.mocked(pool.execute).mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "ER_DUP_ENTRY" }) as never);

    const res = await request(app).post("/api/v1/cars/createCar").set("Authorization", bearer("manager")).send(car);

    expect(res.status).toBe(409);
  });

  it("blocks a status change while the car has an operation in progress", async () => {
    vi.mocked(pool.execute)
      .mockResolvedValueOnce([[{ status: "Available" }], []] as never)
      .mockResolvedValueOnce([[{ trade_id: 4 }], []] as never);

    const res = await request(app).put("/api/v1/cars/updateCar/1").set("Authorization", bearer("manager"))
      .send({ ...car, status: "Out of service" });

    expect(res.status).toBe(409);
    expect(pool.execute).toHaveBeenCalledTimes(2);
  });

  it("updates the car when the status does not change", async () => {
    vi.mocked(pool.execute)
      .mockResolvedValueOnce([[{ status: "Available" }], []] as never)
      .mockResolvedValueOnce(OK as never);

    const res = await request(app).put("/api/v1/cars/updateCar/1").set("Authorization", bearer("manager"))
      .send({ ...car, mileage: 16000 });

    expect(res.status).toBe(200);
  });

  it("changes the sale price", async () => {
    vi.mocked(pool.execute)
      .mockResolvedValueOnce([[{ purchase_price: "250000.00" }], []] as never)
      .mockResolvedValueOnce(OK as never);

    const res = await request(app).patch("/api/v1/cars/updatePrice/1").set("Authorization", bearer("manager"))
      .send({ salePrice: 280000 });

    expect(res.status).toBe(200);
    expect(vi.mocked(pool.execute).mock.calls[1]?.[1]).toEqual([280000, 1]);
  });

  it("blocks deleting a car with an operation in progress", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce([[{ trade_id: 4 }], []] as never);

    const res = await request(app).delete("/api/v1/cars/deleteCar/1").set("Authorization", bearer("manager"));

    expect(res.status).toBe(409);
  });

  it("deletes a car by taking it out of stock", async () => {
    vi.mocked(pool.execute)
      .mockResolvedValueOnce([[], []] as never)
      .mockResolvedValueOnce(OK as never);

    const res = await request(app).delete("/api/v1/cars/deleteCar/1").set("Authorization", bearer("manager"));

    expect(res.status).toBe(200);
    expect(vi.mocked(pool.execute).mock.calls[1]?.[0]).toContain("inventory_status = 'Out of stock'");
  });
});
