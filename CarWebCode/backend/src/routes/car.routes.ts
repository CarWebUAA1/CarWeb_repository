import { Router } from "express";
import type { CarController } from "../controllers/car.controller.js";

// Public routes: the catalog can be browsed without logging in (US-03).
export function createCarRouter(controller: CarController): Router {
  const router = Router();
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  return router;
}
