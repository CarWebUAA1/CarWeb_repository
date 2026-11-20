import { Router } from "express";
import type { SparePartController } from "../controllers/sparePart.controller.js";

import {
  authenticateToken,
  requireManager,
  requireStaff,
} from "../middlewares/auth.middleware.ts";

export function createSparePartRouter(
  controller: SparePartController
): Router {

  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post(
    "/:id/stock-movements",
    authenticateToken,
    requireStaff,
    controller.createStockMovement,
  );
  router.post(
    "/",
    authenticateToken,
    requireManager,
    controller.create
  );

  return router;
}