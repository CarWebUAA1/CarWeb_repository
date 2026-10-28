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
import { describe, it, expect, vi } from 'vitest';
import { Server } from '../src/server.ts';
import sequelizeConnection from '../src/conf/sequelize.connection.ts';

vi.mock('../src/server.ts');
vi.mock('../src/conf/sequelize.connection.ts', 
  () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    getSequelize: vi.fn(() => ({
      define: vi.fn(() => ({})),
    })),
  },
})
)
describe('app.ts config testing', ()=>{  
    it('should start sever',async ()=>{
        
        const dbSpy = vi.spyOn(sequelizeConnection, 'connect');
        await import("../src/app.ts");
        
        expect(dbSpy).toHaveBeenCalledTimes(1);
        expect(Server).toHaveBeenCalledTimes(1);
        expect(Server).toHaveBeenCalledWith({
            port:Number(process.env.PORT),
            routes: expect.any(Function)
        });
        expect(Server.prototype.start).toHaveBeenCalledTimes(1);
    });
});
