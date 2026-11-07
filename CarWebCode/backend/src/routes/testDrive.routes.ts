import { Router } from "express";
import type { TestDriveController } from "../controllers/testDrive.controller.js";

// Employee routes (Manage test drive appointments). Not protected yet: the backend has no session/token.
export function createTestDriveRouter(controller: TestDriveController): Router {
  const router = Router();
  router.get("/", controller.listUpcoming);
  router.get("/pending-appointments", controller.listPendingAppointments);
  router.post("/", controller.schedule);
  return router;
}
