import { Router } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Server } from "../src/server.js";

describe("Server", () => {
  it("answers unknown routes with a JSON 404", async () => {
    const app = new Server({ port: 0, routes: Router() }).server;
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Route not found" });
  });
});
