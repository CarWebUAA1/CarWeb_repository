import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { CarsController } from '../src/controllers/Cars.Controller.js';
import { pool } from '../src/conf/dbConnection.js';

vi.mock('../src/conf/dbConnection.js', () => ({
    pool: { execute: vi.fn() },
}));

function fakeRes() {
    const res = {
        statusCode: 200,
        body: undefined as unknown,
        status(code: number) { res.statusCode = code; return res; },
        json(data: unknown) { res.body = data; return res; },
    };
    return res;
}

const controller = new CarsController();

describe('filter cars by brand and model', () => {
    beforeEach(() => {
        vi.mocked(pool.execute).mockReset();
        vi.mocked(pool.execute).mockResolvedValue([[{ car_id: 1, brand: 'Toyota', model: 'Corolla' }], []] as never);
    });

    it('should only ask for available cars when there are no filters', async () => {
        const res = fakeRes();
        await controller.filterCars({ query: {} } as unknown as Request, res as unknown as Response);
        const [sql, params] = vi.mocked(pool.execute).mock.calls[0]!;
        expect(sql).toContain("status = 'Available'");
        expect(sql).not.toContain('brand = ?');
        expect(params).toEqual([]);
    });

    it('should filter by brand and model without extra spaces', async () => {
        const res = fakeRes();
        await controller.filterCars({ query: { brand: ' Toyota ', model: 'Corolla' } } as unknown as Request, res as unknown as Response);
        const [sql, params] = vi.mocked(pool.execute).mock.calls[0]!;
        expect(sql).toContain('brand = ? and model = ?');
        expect(params).toEqual(['Toyota', 'Corolla']);
        expect(res.body).toEqual({ cars: [{ car_id: 1, brand: 'Toyota', model: 'Corolla' }] });
    });

    it('should say no cars match when nothing is found', async () => {
        vi.mocked(pool.execute).mockResolvedValue([[], []] as never);
        const res = fakeRes();
        await controller.filterCars({ query: { model: 'xyz' } } as unknown as Request, res as unknown as Response);
        expect(res.body).toEqual({ message: 'No cars match your search', cars: [] });
    });

    it('should return 500 when the database fails', async () => {
        vi.mocked(pool.execute).mockRejectedValue(new Error('db down'));
        const res = fakeRes();
        await controller.filterCars({ query: {} } as unknown as Request, res as unknown as Response);
        expect(res.statusCode).toBe(500);
    });
});