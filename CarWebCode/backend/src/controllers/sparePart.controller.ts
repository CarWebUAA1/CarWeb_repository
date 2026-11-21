import type { Request, Response } from "express";

import type {
  SparePartService
} from "../services/sparePart.service.js";

import {
  parseCreateSparePart,
  parseCreateStockMovement,
} from "../validators/sparePart.js";
import { HttpError } from "../errors/HttpError.js";
import { parseCarId, parsePage } from "../validators/car.js";

export class SparePartController {
  constructor(
    private readonly service: SparePartService
  ) {}

  create = async (req: Request, res: Response) => {
    const data = parseCreateSparePart(req.body);

    const sparePart = await this.service.create(data);

    res.status(201).json({
      message: "Spare part registered successfully",
      data: sparePart
    });
  };

  list = async (req: Request, res: Response) => {
    const page = parsePage(req.query["page"]);
    const search = req.query["search"];
    if (search !== undefined && typeof search !== "string") {
      throw new HttpError(400, "search must be a single text value");
    }
    const term = search?.trim();
    if (term && term.length > 100) {
      throw new HttpError(400, "search must be at most 100 characters");
    }
    res.json(await this.service.list(page, term || undefined));
  };

  getById = async (req: Request, res: Response) => {
    const id = parseCarId(req.params["id"]);
    res.json(await this.service.getById(id));
  };

  createStockMovement = async (req: Request, res: Response) => {
    if (!req.auth) throw new HttpError(401, "Authentication required");
    const staffId = Number(req.auth.userId);
    if (!Number.isSafeInteger(staffId) || staffId <= 0) {
      throw new HttpError(401, "Invalid authentication");
    }
    const staffRole = req.auth.role === "manager" ? "Manager" : "Employee";
    const sparePartId = parseCarId(req.params["id"]);
    const movement = parseCreateStockMovement(req.body);
    res.status(201).json({
      message: "Stock movement recorded successfully",
      data: await this.service.createStockMovement(
        sparePartId,
        staffId,
        staffRole,
        movement,
      ),
    });
  };
}