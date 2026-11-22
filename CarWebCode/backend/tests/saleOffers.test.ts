import { Router } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../src/conf/dbConnection.js";
import { deletePhotos, savePhotos } from "../src/utils/photo.util.js";
import SaleOffersRoutes from "../src/routes/SaleOffers.routes.js";
import { Server } from "../src/server.js";

//false conexion
const connection = vi.hoisted(() => ({
  beginTransaction: vi.fn(),
  execute: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
}));

vi.mock("../src/conf/dbConnection.js", () => ({
  pool: { getConnection: vi.fn(), execute: vi.fn() },
}));

//the photos are not written to disk during the tests
vi.mock("../src/utils/photo.util.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/utils/photo.util.js")>()),
  savePhotos: vi.fn(),
  deletePhotos: vi.fn(),
}));

const jpg = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
const png = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64");

const car = {
  brand: "Toyota", model: "Corolla", year: 2020, version: "LE", mileage: 45000,
  fuelType: "Gasoline", transmission: "Automatic", color: "White",
};
const offer = {
  ...car, appointmentId: 4, token: "seed-token-appointment-4", vin: "3TMCZ5AN1LM000099",
  photos: [jpg, png, jpg], acceptEstimate: true,
};

//similar cars: average base price 245000 and 45200 km -> estimate 220500
const SIMILAR = [[{ reference_price: "245000.00", reference_mileage: "45200.0000" }], []];
const NO_SIMILAR = [[{ reference_price: null, reference_mileage: null }], []];
const OK = [{ affectedRows: 1 }, []];
const inserted = (id: number) => [{ affectedRows: 1, insertId: id }, []];

function appointmentRow(changes: object = {}) {
  return [[{
    client_email: "sofia.mendez@example.com", employee_id: 3, appointment_type: "Sale evaluation",
    status: "Confirmed", car_id: null, ...changes,
  }], []];
}

function tradeRow(changes: object = {}) {
  return [[{
    trade_type: "Sale", status: "In progress", is_active: 1, estimated_price: "220500.00",
    listing_price: "220500.00", employee_id: 3, client_email: "sofia.mendez@example.com", in_cooldown: null, ...changes,
  }], []];
}

describe("Offer my car for sale", () => {
  let app: Server["server"];

  beforeEach(() => {
    //calls get cleaned
    Object.values(connection).forEach((fn) => fn.mockReset());
    vi.mocked(pool.execute).mockReset();
    vi.mocked(pool.getConnection).mockReset();
    vi.mocked(pool.getConnection).mockResolvedValue(connection as never);
    vi.mocked(savePhotos).mockReset();
    vi.mocked(savePhotos).mockResolvedValue(["uploads/cars/a-1.jpg", "uploads/cars/a-2.png", "uploads/cars/a-3.jpg"]);
    vi.mocked(deletePhotos).mockReset();

    const routes = Router();
    routes.use("/sale-offers", SaleOffersRoutes);
    app = new Server({ port: 0, routes }).server;
  });

  describe("POST /api/v1/sale-offers/estimate", () => {
    it("returns the estimate with its label", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);

      const res = await request(app).post("/api/v1/sale-offers/estimate").send(car);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ estimatedPrice: 220500, label: "Estimated – subject to inspection" });
    });

    it("returns 422 when there are no similar cars to compare", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(NO_SIMILAR as never);

      const res = await request(app).post("/api/v1/sale-offers/estimate").send(car);

      expect(res.status).toBe(422);
    });

    it("returns 422 when the estimate is below the minimum price", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);

      const res = await request(app).post("/api/v1/sale-offers/estimate").send({ ...car, mileage: 990000 });

      expect(res.status).toBe(422);
    });

    it("returns 400 for an invalid year", async () => {
      const res = await request(app).post("/api/v1/sale-offers/estimate").send({ ...car, year: 1985 });

      expect(res.status).toBe(400);
      expect(pool.execute).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/sale-offers", () => {
    it("creates the car and the trade, notifies the employee and writes the log", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);
      connection.execute
        .mockResolvedValueOnce(appointmentRow()) //reads the appointment
        .mockResolvedValueOnce(inserted(9)) //car
        .mockResolvedValueOnce(OK) //appointment gets the car
        .mockResolvedValueOnce(inserted(3)) //trade
        .mockResolvedValueOnce(OK) //notification
        .mockResolvedValueOnce(OK); //log

      const res = await request(app).post("/api/v1/sale-offers").send(offer);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ tradeId: 3, carId: 9, status: "In progress", estimatedPrice: 220500 });
      expect(connection.execute.mock.calls[3]?.[1]).toEqual([4, 3, 9, 220500, 220500]);
      expect(connection.execute.mock.calls[4]?.[1]?.[0]).toBe(3);
      expect(connection.execute.mock.calls[5]?.[1]).toEqual(["sofia.mendez@example.com", 3, "Sale offer created", 220500]);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("gives the request to the employee with the fewest active trades when none is assigned", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);
      connection.execute
        .mockResolvedValueOnce(appointmentRow({ employee_id: null }))
        .mockResolvedValueOnce([[{ staff_id: 2 }], []])
        .mockResolvedValueOnce(inserted(9))
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(inserted(3))
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(OK);

      const res = await request(app).post("/api/v1/sale-offers").send(offer);

      expect(res.status).toBe(201);
      expect(connection.execute.mock.calls[4]?.[1]?.[1]).toBe(2);
    });

    it("returns 400 when the estimate is not accepted", async () => {
      const res = await request(app).post("/api/v1/sale-offers").send({ ...offer, acceptEstimate: false });

      expect(res.status).toBe(400);
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    it.each([
      ["fewer than 3 photos", [jpg, png]],
      ["more than 5 photos", [jpg, jpg, jpg, jpg, jpg, jpg]],
      ["a photo that is not a JPG or PNG", [jpg, png, "data:image/gif;base64,R0lGODlh"]],
    ])("returns 400 with %s", async (_case, photos) => {
      const res = await request(app).post("/api/v1/sale-offers").send({ ...offer, photos });

      expect(res.status).toBe(400);
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    it("returns 404 when the appointment or the token is wrong", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);
      connection.execute.mockResolvedValueOnce([[], []]);

      const res = await request(app).post("/api/v1/sale-offers").send(offer);

      expect(res.status).toBe(404);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it("returns 409 when the appointment is not a sale evaluation", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);
      connection.execute.mockResolvedValueOnce(appointmentRow({ appointment_type: "Viewing" }));

      const res = await request(app).post("/api/v1/sale-offers").send(offer);

      expect(res.status).toBe(409);
      expect(savePhotos).not.toHaveBeenCalled();
    });

    it("returns 409 and deletes the photos when the VIN is already registered", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);
      connection.execute
        .mockResolvedValueOnce(appointmentRow())
        .mockRejectedValueOnce(Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" }));

      const res = await request(app).post("/api/v1/sale-offers").send(offer);

      expect(res.status).toBe(409);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(deletePhotos).toHaveBeenCalledTimes(1);
    });

    it("returns 500, saves nothing and deletes the photos when the database fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(pool.execute).mockResolvedValueOnce(SIMILAR as never);
      connection.execute
        .mockResolvedValueOnce(appointmentRow())
        .mockResolvedValueOnce(inserted(9))
        .mockRejectedValueOnce(new Error("db down"));

      const res = await request(app).post("/api/v1/sale-offers").send(offer);

      expect(res.status).toBe(500);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(deletePhotos).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("PATCH /api/v1/sale-offers/:id/listing-price", () => {
    const changePrice = (body: object) => request(app).patch("/api/v1/sale-offers/3/listing-price").send(body);

    it("changes the price, notifies the employee and logs the change", async () => {
      connection.execute
        .mockResolvedValueOnce(tradeRow())
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(OK);

      const res = await changePrice({ token: "abc", listingPrice: 230000 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ previousPrice: 220500, listingPrice: 230000 });
      expect(connection.execute.mock.calls[3]?.[1]).toEqual([
        "sofia.mendez@example.com", 3, "Listing price changed", 220500, 220500, 230000,
      ]);
      expect(connection.commit).toHaveBeenCalledTimes(1);
    });

    it("returns 409 when the price was changed less than 24 hours ago", async () => {
      connection.execute.mockResolvedValueOnce(tradeRow({ in_cooldown: 1 }));

      const res = await changePrice({ token: "abc", listingPrice: 230000 });

      expect(res.status).toBe(409);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when the price is more than 10% above the estimate", async () => {
      connection.execute.mockResolvedValueOnce(tradeRow());

      const res = await changePrice({ token: "abc", listingPrice: 250000 });

      expect(res.status).toBe(400);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it.each([19999, "230000", 230000.123])("returns 400 for the invalid price %s", async (listingPrice) => {
      const res = await changePrice({ token: "abc", listingPrice });

      expect(res.status).toBe(400);
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    it("returns 409 when the sale request is no longer in progress", async () => {
      connection.execute.mockResolvedValueOnce(tradeRow({ status: "Completed", is_active: 0 }));

      const res = await changePrice({ token: "abc", listingPrice: 230000 });

      expect(res.status).toBe(409);
    });

    it("returns 404 when the trade or the token is wrong", async () => {
      connection.execute.mockResolvedValueOnce([[], []]);

      const res = await changePrice({ token: "wrong", listingPrice: 230000 });

      expect(res.status).toBe(404);
    });
  });
});