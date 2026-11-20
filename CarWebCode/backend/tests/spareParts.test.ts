import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Router } from "express";
import { SparePartController } from "../src/controllers/sparePart.controller.js";
import type {
  CreateSparePartDto,
  CreateStockMovementDto,
  SparePartDto,
  StockMovementDto,
} from "../src/dtos/spareParts/SparePartDto.js";
import type { SparePartRepository } from "../src/repositories/sparePart.repository.js";
import { createSparePartRouter } from "../src/routes/sparePart.routes.js";
import { Server } from "../src/server.js";
import { SparePartService } from "../src/services/sparePart.service.js";

const originalJwtSecret = process.env["JWT_SECRET"];

function sparePart(id: number): SparePartDto {
  return {
    id,
    carId: null,
    brand: "Nissan",
    model: "Versa",
    status: "Available",
    price: 2200,
    inventoryStatus: "In stock",
  };
}

class FakeSparePartRepository implements SparePartRepository {
  readonly searchTerms: Array<string | undefined> = [];
  readonly movements: Array<{ id: number; staffId: number; role: string; data: CreateStockMovementDto }> = [];
  parts = [sparePart(1), sparePart(2)];

  async create(data: CreateSparePartDto): Promise<SparePartDto> {
    return { ...sparePart(3), ...data, id: 3 };
  }

  async findAvailable(search: string | undefined, limit: number, offset: number) {
    this.searchTerms.push(search);
    return { rows: this.parts.slice(offset, offset + limit), total: this.parts.length };
  }

  async findById(id: number): Promise<SparePartDto | null> {
    return this.parts.find((part) => part.id === id) ?? null;
  }

  async createStockMovement(
    sparePartId: number,
    staffId: number,
    staffRole: "Employee" | "Manager",
    data: CreateStockMovementDto,
  ): Promise<StockMovementDto> {
    this.movements.push({ id: sparePartId, staffId, role: staffRole, data });
    return {
      id: this.movements.length,
      sparePartId,
      ...data,
      movementDate: "2026-11-20T12:00:00.000Z",
    };
  }
}

describe("Spare parts API", () => {
  let repository: FakeSparePartRepository;
  let app: Server["server"];

  beforeEach(() => {
    process.env["JWT_SECRET"] = "spare-part-test-secret";
    repository = new FakeSparePartRepository();
    const routes = Router();
    routes.use(
      "/spare-parts",
      createSparePartRouter(
        new SparePartController(new SparePartService(repository)),
      ),
    );
    app = new Server({ port: 0, routes }).server;
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) delete process.env["JWT_SECRET"];
    else process.env["JWT_SECRET"] = originalJwtSecret;
  });

  it("searches the public catalog and returns pagination data", async () => {
    const response = await request(app)
      .get("/api/v1/spare-parts")
      .query({ page: "1", search: " versa " });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [{ id: 1, brand: "Nissan", model: "Versa" }, { id: 2 }],
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    });
    expect(repository.searchTerms).toEqual(["versa"]);
  });

  it("returns spare part details or a not found response", async () => {
    const response = await request(app).get("/api/v1/spare-parts/1");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 1, inventoryStatus: "In stock" });

    const missing = await request(app).get("/api/v1/spare-parts/50");
    expect(missing.status).toBe(404);
  });

  it("allows an employee to record a stock movement", async () => {
    const token = jwt.sign({ role: "employee" }, "spare-part-test-secret", { subject: "8" });
    const response = await request(app)
      .post("/api/v1/spare-parts/1/stock-movements")
      .set("Authorization", `Bearer ${token}`)
      .send({ movementType: "Out", reason: "Sale" });

    expect(response.status).toBe(201);
    expect(repository.movements).toEqual([
      { id: 1, staffId: 8, role: "Employee", data: { movementType: "Out", reason: "Sale" } },
    ]);
  });

  it("rejects stock movement requests from users without a staff role", async () => {
    const token = jwt.sign({ role: "customer" }, "spare-part-test-secret", { subject: "8" });
    const response = await request(app)
      .post("/api/v1/spare-parts/1/stock-movements")
      .set("Authorization", `Bearer ${token}`)
      .send({ movementType: "Out", reason: "Sale" });

    expect(response.status).toBe(403);
    expect(repository.movements).toHaveLength(0);
  });

  it("rejects unsupported stock movement values", async () => {
    const token = jwt.sign({ role: "manager" }, "spare-part-test-secret", { subject: "1" });
    const response = await request(app)
      .post("/api/v1/spare-parts/1/stock-movements")
      .set("Authorization", `Bearer ${token}`)
      .send({ movementType: "Remove", reason: "Sale" });

    expect(response.status).toBe(400);
    expect(repository.movements).toHaveLength(0);
  });
});
