import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { CarController } from "../src/controllers/car.controller.js";
import type { CarSummaryDto } from "../src/dtos/cars/CarDto.js";
import type { CarDetailRecord, CarRepository } from "../src/repositories/car.repository.js";
import { createCarRouter } from "../src/routes/car.routes.js";
import { Server } from "../src/server.js";
import { CarService } from "../src/services/car.service.js";
import { Router } from "express";

function summary(id: number): CarSummaryDto {
  return { id, brand: "Toyota", model: "Corolla", year: 2020, mileage: 1000, price: 250000, photoUrl: null };
}

function detail(id: number, status: string): CarDetailRecord {
  return {
    id,
    brand: "Honda",
    model: "Civic",
    year: 2019,
    version: "EX",
    series: "FC",
    mileage: 61000,
    fuelType: "Gasoline",
    transmission: "CVT",
    color: "Black",
    tireCondition: "Good",
    price: 268000,
    status,
    photos: [{ id: 1, url: "https://example.com/1.jpg", isMain: true }],
  };
}

// In-memory repository: 45 available cars and one sold car (id 99).
class FakeCarRepository implements CarRepository {
  readonly calls: Array<{ limit: number; offset: number }> = [];
  available = Array.from({ length: 45 }, (_, i) => summary(i + 1));

  async findAvailable(limit: number, offset: number) {
    this.calls.push({ limit, offset });
    return { rows: this.available.slice(offset, offset + limit), total: this.available.length };
  }

  async findById(id: number) {
    if (id === 99) return detail(99, "Sold");
    return id <= this.available.length ? detail(id, "Available") : null;
  }
}

describe("Cars API", () => {
  let repo: FakeCarRepository;
  let app: Server["server"];

  beforeEach(() => {
    repo = new FakeCarRepository();
    const routes = Router();
    routes.use("/cars", createCarRouter(new CarController(new CarService(repo))));
    app = new Server({ port: 0, routes }).server;
  });

  describe("GET /api/v1/cars (US-03)", () => {
    it("returns the first page of 20 when no page is given", async () => {
      const res = await request(app).get("/api/v1/cars");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(20);
      expect(res.body).toMatchObject({ page: 1, pageSize: 20, total: 45, totalPages: 3 });
      expect(repo.calls[0]).toEqual({ limit: 20, offset: 0 });
    });

    it("returns the remaining cars on the last page", async () => {
      const res = await request(app).get("/api/v1/cars?page=3");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(5);
      expect(repo.calls[0]).toEqual({ limit: 20, offset: 40 });
    });

    it("returns an empty list when there are no cars available", async () => {
      repo.available = [];
      const res = await request(app).get("/api/v1/cars");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ data: [], total: 0, totalPages: 0 });
    });

    it.each(["0", "-1", "abc", "1.5"])("rejects page=%s with 400", async (page) => {
      const res = await request(app).get(`/api/v1/cars?page=${page}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /api/v1/cars/:id (US-05)", () => {
    it("returns all the details of an available car", async () => {
      const res = await request(app).get("/api/v1/cars/3");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 3, brand: "Honda", status: "Available", isAvailable: true });
      expect(res.body.photos).toHaveLength(1);
    });

    it("marks a sold car as not available", async () => {
      const res = await request(app).get("/api/v1/cars/99");
      expect(res.status).toBe(200);
      expect(res.body.isAvailable).toBe(false);
    });

    it("returns 404 when the car does not exist", async () => {
      const res = await request(app).get("/api/v1/cars/500");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Car not found");
    });

    it("returns 400 when the id is not a positive integer", async () => {
      const res = await request(app).get("/api/v1/cars/abc");
      expect(res.status).toBe(400);
    });

    it("never exposes internal fields", async () => {
      const res = await request(app).get("/api/v1/cars/3");
      expect(res.body).not.toHaveProperty("purchasePrice");
      expect(res.body).not.toHaveProperty("vin");
      expect(res.body).not.toHaveProperty("plates");
    });
  });
});
