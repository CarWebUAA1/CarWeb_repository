import CarsRoutes from "./Cars.routes.js";
import { Router } from "express";
import { pool } from "../conf/dbConnection.js";
import { CarController } from "../controllers/car.controller.js";
import { MySqlCarRepository } from "../repositories/car.repository.js";
import { CarService } from "../services/car.service.js";
import { createCarRouter } from "./car.routes.js";

const router = Router();

// Inventory management (US-20). Mounted first: its fixed paths (/getAllCars, ...)
// must be matched before the catalog's GET /:id below.
router.use("/cars", CarsRoutes);

// Public catalog (US-03) and car details (US-05): GET /cars?page=N and GET /cars/:id.
const catalogController = new CarController(new CarService(new MySqlCarRepository(pool)));
router.use("/cars", createCarRouter(catalogController));

export default router;
