import type { Request, Response } from "express";
import type { CarService } from "../services/car.service.js";
import { parseCarId, parsePage } from "../validators/car.js";

export class CarController {
  constructor(private readonly service: CarService) {}

  // GET /cars?page=1
  list = async (req: Request, res: Response) => {
    const page = parsePage(req.query["page"]);
    res.json(await this.service.listAvailable(page));
  };

  // GET /cars/:id
  getById = async (req: Request, res: Response) => {
    const id = parseCarId(req.params["id"]);
    res.json(await this.service.getById(id));
  };
}
