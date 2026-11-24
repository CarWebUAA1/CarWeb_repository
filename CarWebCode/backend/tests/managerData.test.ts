import { Router } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ManagerDataController, type ManagerDataQuery } from "../src/controllers/managerData.controller.js";
import { createManagerDataRouter } from "../src/routes/managerData.routes.js";
import { Server } from "../src/server.js";

describe("GET /api/v1/manager/data/:table", () => {
  const secret = "manager-data-test-secret";
  let query: ReturnType<typeof vi.fn<ManagerDataQuery>>;
  let app: Server["server"];

  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", secret);
    query = vi.fn<ManagerDataQuery>(async () => [{ appointment_id: 1 } as RowDataPacket]);
    const routes = Router();
    routes.use("/manager/data", createManagerDataRouter(new ManagerDataController(query)));
    app = new Server({ port: 0, routes }).server;
  });

  afterEach(() => vi.unstubAllEnvs());

  it("requires a manager role before querying data", async () => {
    const token = jwt.sign({ role: "employee" }, secret, { subject: "1" });
    const res = await request(app)
      .get("/api/v1/manager/data/appointments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });

  it("returns table records using an explicit column allowlist", async () => {
    const token = jwt.sign({ role: "manager" }, secret, { subject: "1" });
    const res = await request(app)
      .get("/api/v1/manager/data/appointments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.table).toBe("appointments");
    expect(res.body.rows).toEqual([{ appointment_id: 1 }]);
    expect(res.body.columns).not.toContain("manage_token_hash");
    expect(query).toHaveBeenCalledWith(expect.not.stringContaining("manage_token_hash"));
  });

  it.each(["staff", "price-breakdowns", "__proto__", "constructor"])("rejects the unlisted table %s", async (table) => {
    const token = jwt.sign({ role: "manager" }, secret, { subject: "1" });
    const res = await request(app)
      .get(`/api/v1/manager/data/${table}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(query).not.toHaveBeenCalled();
  });
});
