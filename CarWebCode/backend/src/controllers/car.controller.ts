import type { Request, Response } from "express";
import type { CarService } from "../services/car.service.js";
import { parseCarFilters, parseCarId, parsePage } from "../validators/car.js";

export class CarController {
  constructor(private readonly service: CarService) {}

  // GET /cars?page=1&search=toyota&brand=Toyota&model=Corolla (all optional)
  list = async (req: Request, res: Response) => {
    const page = parsePage(req.query["page"]);
    const filters = parseCarFilters(req.query);
    res.json(await this.service.listAvailable(page, filters));
  };

  // GET /cars/:id
  getById = async (req: Request, res: Response) => {
    const id = parseCarId(req.params["id"]);
    res.json(await this.service.getById(id));
  };
}
