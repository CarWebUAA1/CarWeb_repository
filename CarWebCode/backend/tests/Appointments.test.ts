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
  pool: { getConnection: vi.fn() },
}));


function appointmentRow(clientId: number, status: string) {
  return [[{ ClientId: clientId, Status: status }], []];
}

const OK = [{ affectedRows: 1 }, []];

describe("Appointments API", () => {
  let app: Server["server"];

  const cancel = (id: number | string, body: object) =>
    request(app).patch(`/api/v1/appointments/${id}/cancel`).send(body);

  beforeEach(() => {
    //calls get cleaned
    Object.values(connection).forEach((fn) => fn.mockReset());
    vi.mocked(pool.getConnection).mockResolvedValue(connection as never);

    const routes = Router();
    routes.use("/appointments", AppointmentsRoutes);
    app = new Server({ port: 0, routes }).server;
  });

  describe("PATCH /api/v1/appointments/:id/cancel", () => {
    it("cancels a pending appointment and writes the log", async () => {
      connection.execute
        .mockResolvedValueOnce(appointmentRow(1, "Pending"))  //reads date.
        .mockResolvedValueOnce(OK) //state
        .mockResolvedValueOnce(OK); //logs

      const res = await cancel(5, { userId: 1, confirm: true, reason: "i cannot attend" });

      
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "appointment has been cancelled" });
      expect(connection.execute).toHaveBeenCalledTimes(3);
      expect(connection.execute.mock.calls[2]?.[1]).toEqual([1, 5, "Cancelled", "i cannot attend"]);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("accepts a cancellation without a reason and stores it as NULL", async () => {
      connection.execute
        .mockResolvedValueOnce(appointmentRow(1, "Confirmed"))
        .mockResolvedValueOnce(OK)
        .mockResolvedValueOnce(OK);

      const res = await cancel(5, { userId: 1, confirm: true });

      expect(res.status).toBe(200);
      expect(connection.execute.mock.calls[2]?.[1]).toEqual([1, 5, "Cancelled", null]);
    });

    it("returns 400 when the cancellation is not confirmed", async () => {
      const res = await cancel(5, { userId: 1, reason: "No puedo asistir" });

      expect(res.status).toBe(400);
      expect(connection.beginTransaction).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid appointment id", async () => {
      const res = await cancel("abc", { userId: 1, confirm: true });

      expect(res.status).toBe(400);
      expect(connection.beginTransaction).not.toHaveBeenCalled();
    });

    it("returns 400 when userId is not a positive integer", async () => {
      const res = await cancel(5, { userId: "1", confirm: true });

      expect(res.status).toBe(400);
      expect(connection.beginTransaction).not.toHaveBeenCalled();
    });

    it("returns 404 when the appointment does not exist", async () => {
      connection.execute.mockResolvedValueOnce([[], []]);

      const res = await cancel(99, { userId: 1, confirm: true });

      expect(res.status).toBe(404);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it("returns 404 when the appointment belongs to another user", async () => {
      connection.execute.mockResolvedValueOnce(appointmentRow(2, "Pending"));

      const res = await cancel(5, { userId: 1, confirm: true });

      expect(res.status).toBe(404);
      expect(connection.execute).toHaveBeenCalledTimes(1); //only the reading and no changes
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it.each(["Attended", "Completed", "Cancelled"])(
      "returns 409 when the appointment is already %s",
      async (status) => {
        connection.execute.mockResolvedValueOnce(appointmentRow(1, status));

        const res = await cancel(5, { userId: 1, confirm: true });

        expect(res.status).toBe(409);
        expect(connection.execute).toHaveBeenCalledTimes(1);
        expect(connection.rollback).toHaveBeenCalledTimes(1);
      },
    );

    it("returns 500, rolls back and releases the connection when the database fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {}); 
      connection.execute.mockRejectedValueOnce(new Error("db down"));

      const res = await cancel(5, { userId: 1, confirm: true });

      expect(res.status).toBe(500);
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });
});