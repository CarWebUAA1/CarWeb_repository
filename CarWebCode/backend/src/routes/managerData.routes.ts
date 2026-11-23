import { Router } from "express";
import type { ManagerDataController } from "../controllers/managerData.controller.js";
import { authenticateToken, requireManager } from "../middlewares/auth.middleware.js";

export function createManagerDataRouter(controller: ManagerDataController): Router {
  const router = Router();
  router.get("/:table", authenticateToken, requireManager, controller.list);
  return router;
}
