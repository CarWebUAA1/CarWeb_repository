import { Router } from "express";
import type { AppointmentController } from "../controllers/appointment.controller.js";
import {
  authenticateToken,
  requireStaff
} from "../middlewares/auth.middleware.js";

export function createAppointmentRouter(
  controller: AppointmentController
): Router {
  const router = Router();

  router.post("/", controller.create);

  router.get("/", authenticateToken, requireStaff, controller.listAll);

  router.patch("/:id/status", authenticateToken, requireStaff, controller.updateStatus);
  
  router.patch("/:id/reschedule", authenticateToken, requireStaff, controller.reschedule);
  
  return router;
}