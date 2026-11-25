import { Router } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../src/conf/dbConnection.js";
import AppointmentsRoutes from "../src/routes/Appointments.routes.js";
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

const TOKEN = "a".repeat(64);
const OK = [{ affectedRows: 1 }, []];

/** "YYYY-MM-DD HH:MM" in local time, `days` from today at `hour`:00. */
function slot(days: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(hour)}:00`;
}

function appointmentRow(status: string, datetime = `${slot(3)}:00`, employeeId: number | null = 4) {
  return [[{
    client_email: "ana@mail.com",
    employee_id: employeeId,
    car_id: 2,
    status,
    appointment_datetime: datetime,
  }], []];
}

describe("Appointments API (customer side)", () => {
  let app: Server["server"];

  const cancel = (id: number | string, body: object) =>
    request(app).patch(`/api/v1/appointments/${id}/cancel`).send(body);
  const modify = (id: number | string, body: object) =>
    request(app).patch(`/api/v1/appointments/${id}/modify`).send(body);

  beforeEach(() => {
    //calls get cleaned
    Object.values(connection).forEach((fn) => fn.mockReset());
    vi.mocked(pool.getConnection).mockResolvedValue(connection as never);
    vi.mocked(pool.execute).mockReset();

    const routes = Router();
    routes.use("/appointments", AppointmentsRoutes);
    app = new Server({ port: 0, routes }).server;
  });

  describe("PATCH /api/v1/appointments/:id/cancel", () => {
    it("cancels a pending appointment, notifies the employee and writes the log", async () => {
      connection.execute
        .mockResolvedValueOnce(appointmentRow("Pending")) //reads the appointment
        .mockResolvedValueOnce(OK) //status
        .mockResolvedValueOnce(OK) //notification
        .mockResolvedValueOnce(OK); //log

      const res = await cancel(5, { token: TOKEN, confirm: true, reason: "i cannot attend" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "appointment has been cancelled", appointmentId: 5, status: "Cancelled" });
      expect(connection.execute.mock.calls[0]?.[1]).toEqual([5, TOKEN]);
      expect(connection.execute.mock.calls[1]?.[1]).toEqual(["i cannot attend", 5]);
      expect(connection.execute.mock.calls[2]?.[1]?.[0]).toBe(4);
      expect(connection.execute.mock.calls[3]?.[1]).toEqual(["ana@mail.com", 5, "Cancelled", `${slot(3)}:00`]);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("stores no reason as NULL and skips the notification when nobody is assigned", async () => {
      connection.execute
        .mockResolvedValueOnce(appointmentRow("Confirmed", `${slot(3)}:00`, null))
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(OK);

      const res = await cancel(5, { token: TOKEN, confirm: true });

      expect(res.status).toBe(200);
      expect(connection.execute).toHaveBeenCalledTimes(3);
      expect(connection.execute.mock.calls[1]?.[1]).toEqual([null, 5]);
    });

    it("returns 400 when the cancellation is not confirmed", async () => {
      const res = await cancel(5, { token: TOKEN, reason: "No puedo asistir" });

      expect(res.status).toBe(400);
      expect(connection.beginTransaction).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid appointment id", async () => {
      const res = await cancel("abc", { token: TOKEN, confirm: true });

      expect(res.status).toBe(400);
      expect(connection.beginTransaction).not.toHaveBeenCalled();
    });

    it("returns 400 without a token", async () => {
      const res = await cancel(5, { confirm: true });

      expect(res.status).toBe(400);
      expect(connection.beginTransaction).not.toHaveBeenCalled();
    });

    it("returns 400 when the reason is longer than 255 characters", async () => {
      const res = await cancel(5, { token: TOKEN, confirm: true, reason: "x".repeat(256) });

      expect(res.status).toBe(400);
    });

    it("returns 404 when the id or the token are wrong", async () => {
      connection.execute.mockResolvedValueOnce([[], []]);

      const res = await cancel(99, { token: TOKEN, confirm: true });

      expect(res.status).toBe(404);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it.each(["Completed", "Cancelled", "Rejected", "No show"])(
      "returns 409 when the appointment is already %s",
      async (status) => {
        connection.execute.mockResolvedValueOnce(appointmentRow(status));

        const res = await cancel(5, { token: TOKEN, confirm: true });

        expect(res.status).toBe(409);
        expect(connection.execute).toHaveBeenCalledTimes(1);
        expect(connection.rollback).toHaveBeenCalledTimes(1);
      },
    );

    it("returns 500, rolls back and releases the connection when the database fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      connection.execute.mockRejectedValueOnce(new Error("db down"));

      const res = await cancel(5, { token: TOKEN, confirm: true });

      expect(res.status).toBe(500);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("PATCH /api/v1/appointments/:id/modify", () => {
    it("moves the appointment, sets it back to Pending and writes the log", async () => {
      const newDatetime = slot(5, 11);
      connection.execute
        .mockResolvedValueOnce(appointmentRow("Confirmed"))
        .mockResolvedValueOnce([[], []]) //slot is free
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(OK);

      const res = await modify(5, { token: TOKEN, newDatetime });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ newDatetime: `${newDatetime}:00`, status: "Pending" });
      expect(connection.commit).toHaveBeenCalledTimes(1);
    });

    it("returns 409 when the new slot is taken", async () => {
      connection.execute
        .mockResolvedValueOnce(appointmentRow("Pending"))
        .mockResolvedValueOnce([[{ appointment_id: 8 }], []]);

      const res = await modify(5, { token: TOKEN, newDatetime: slot(5, 11) });

      expect(res.status).toBe(409);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it("returns 400 for a date outside the next 30 days", async () => {
      const res = await modify(5, { token: TOKEN, newDatetime: slot(40) });

      expect(res.status).toBe(400);
      expect(connection.beginTransaction).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/appointments/:id/manage", () => {
    it("returns the appointment and its sale offer for the right token", async () => {
      vi.mocked(pool.execute)
        .mockResolvedValueOnce([[{
          appointment_id: 5,
          client_name: "Ana",
          appointment_type: "Sale evaluation",
          status: "Pending",
          cancel_reason: null,
          appointment_datetime: `${slot(3)}:00`,
          car_id: 9,
          car: "Mazda 3 2020",
        }], []] as never)
        .mockResolvedValueOnce([[{
          trade_id: 3, status: "In progress", estimated_price: "210000.00", listing_price: "220000.00", last_price_edit: null,
        }], []] as never);

      const res = await request(app).get("/api/v1/appointments/5/manage").set("X-Manage-Token", TOKEN);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        appointmentId: 5,
        status: "Pending",
        canCancel: true,
        canModify: true,
        saleOffer: { tradeId: 3, estimatedPrice: 210000, listingPrice: 220000 },
      });
      expect(vi.mocked(pool.execute).mock.calls[0]?.[1]).toEqual([5, TOKEN]);
    });

    it("returns 400 without the token header", async () => {
      const res = await request(app).get("/api/v1/appointments/5/manage");

      expect(res.status).toBe(400);
      expect(pool.execute).not.toHaveBeenCalled();
    });

    it("returns 404 when the token does not match", async () => {
      vi.mocked(pool.execute).mockResolvedValueOnce([[], []] as never);

      const res = await request(app).get("/api/v1/appointments/5/manage").set("X-Manage-Token", TOKEN);

      expect(res.status).toBe(404);
    });
  });
});
