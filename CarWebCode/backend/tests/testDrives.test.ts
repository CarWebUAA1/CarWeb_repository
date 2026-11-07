import { Router } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { TestDriveController } from "../src/controllers/testDrive.controller.js";
import type { ScheduleTestDriveDto } from "../src/dtos/testDrives/TestDriveDto.js";
import type { ScheduleResult, TestDriveRepository } from "../src/repositories/testDrive.repository.js";
import { createTestDriveRouter } from "../src/routes/testDrive.routes.js";
import { Server } from "../src/server.js";
import { TestDriveService } from "../src/services/testDrive.service.js";

/** Fake repository that keeps test drives in memory and applies the same overlap rule. */
class FakeTestDriveRepository implements TestDriveRepository {
  drives: Array<ScheduleTestDriveDto & { id: number }> = [
    { id: 1, appointmentId: 3, employeeId: 2, carId: 2, scheduleStart: "2026-11-20 16:00:00", scheduleEnd: "2026-11-20 16:45:00" },
  ];
  inputs: ScheduleTestDriveDto[] = [];
  forced: ScheduleResult | null = null;

  async scheduleIfFree(input: ScheduleTestDriveDto): Promise<ScheduleResult> {
    this.inputs.push(input);
    if (this.forced) return this.forced;
    const overlap = this.drives.find(
      (d) => d.carId === input.carId && d.scheduleStart < input.scheduleEnd && d.scheduleEnd > input.scheduleStart,
    );
    if (overlap) {
      return { ok: false, reason: "overlap", overlapping: { id: overlap.id, scheduleStart: overlap.scheduleStart, scheduleEnd: overlap.scheduleEnd } };
    }
    const created = { id: this.drives.length + 1, ...input };
    this.drives.push(created);
    return { ok: true, testDrive: created };
  }
}

const valid = {
  appointmentId: 9,
  employeeId: 1,
  carId: 2,
  scheduleStart: "2026-11-20T17:00",
  scheduleEnd: "2026-11-20T17:45",
};

describe("POST /api/v1/test-drives", () => {
  let repo: FakeTestDriveRepository;
  let app: Server["server"];

  beforeEach(() => {
    repo = new FakeTestDriveRepository();
    const routes = Router();
    routes.use("/test-drives", createTestDriveRouter(new TestDriveController(new TestDriveService(repo))));
    app = new Server({ port: 0, routes }).server;
  });

  it("schedules a test drive that does not overlap and normalizes the datetimes", async () => {
    const res = await request(app).post("/api/v1/test-drives").send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 2,
      carId: 2,
      scheduleStart: "2026-11-20 17:00:00",
      scheduleEnd: "2026-11-20 17:45:00",
    });
  });

  it("allows a test drive that starts exactly when the previous one ends", async () => {
    const res = await request(app)
      .post("/api/v1/test-drives")
      .send({ ...valid, scheduleStart: "2026-11-20 16:45", scheduleEnd: "2026-11-20 17:30" });
    expect(res.status).toBe(201);
  });

  it.each([
    ["starts inside", "2026-11-20 16:30", "2026-11-20 17:15"],
    ["ends inside", "2026-11-20 15:30", "2026-11-20 16:15"],
    ["contains it", "2026-11-20 15:00", "2026-11-20 18:00"],
    ["is inside it", "2026-11-20 16:10", "2026-11-20 16:20"],
  ])("rejects a test drive that %s an existing one with 409", async (_case, scheduleStart, scheduleEnd) => {
    const res = await request(app).post("/api/v1/test-drives").send({ ...valid, scheduleStart, scheduleEnd });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("The car already has a test drive from 2026-11-20 16:00:00 to 2026-11-20 16:45:00");
  });

  it("allows the same time range for a different car", async () => {
    const res = await request(app)
      .post("/api/v1/test-drives")
      .send({ ...valid, carId: 3, scheduleStart: "2026-11-20 16:00", scheduleEnd: "2026-11-20 16:45" });
    expect(res.status).toBe(201);
  });

  it.each([
    ["a missing carId", { ...valid, carId: undefined }, "carId must be a positive integer"],
    ["a text employeeId", { ...valid, employeeId: "abc" }, "employeeId must be a positive integer"],
    ["a badly formatted date", { ...valid, scheduleStart: "20/11/2026 17:00" }, "scheduleStart must be a datetime like 2026-11-20 16:00"],
    ["an impossible date", { ...valid, scheduleEnd: "2026-02-30 10:00" }, "scheduleEnd is not a valid date and time"],
    ["an end before the start", { ...valid, scheduleEnd: "2026-11-20 16:59" }, "scheduleEnd must be after scheduleStart"],
    ["an end equal to the start", { ...valid, scheduleEnd: "2026-11-20 17:00" }, "scheduleEnd must be after scheduleStart"],
  ])("rejects %s with 400", async (_case, body, message) => {
    const res = await request(app).post("/api/v1/test-drives").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
    expect(repo.inputs).toHaveLength(0);
  });

  it.each([
    ["car-not-found", 404, "Car not found"],
    ["employee-not-found", 404, "Employee not found"],
    ["appointment-not-found", 404, "Appointment not found"],
    ["not-a-test-drive-appointment", 409, "The appointment is not a test drive appointment"],
    ["appointment-already-has-test-drive", 409, "The appointment already has a test drive"],
  ] as const)("maps %s to %i", async (reason, status, message) => {
    repo.forced = { ok: false, reason };
    const res = await request(app).post("/api/v1/test-drives").send(valid);
    expect(res.status).toBe(status);
    expect(res.body.error).toBe(message);
  });
});
