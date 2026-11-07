import type { Request, Response } from "express";
import type { TestDriveService } from "../services/testDrive.service.js";
import { parseScheduleTestDrive } from "../validators/testDrive.js";

export class TestDriveController {
  constructor(private readonly service: TestDriveService) {}

  // POST /test-drives  { appointmentId, employeeId, carId, scheduleStart, scheduleEnd }
  schedule = async (req: Request, res: Response) => {
    const input = parseScheduleTestDrive(req.body);
    res.status(201).json(await this.service.schedule(input));
  };

  // GET /test-drives: test drives that have not finished yet
  listUpcoming = async (_req: Request, res: Response) => {
    res.json(await this.service.listUpcoming());
  };

  // GET /test-drives/pending-appointments: "Test drive" appointments still to schedule
  listPendingAppointments = async (_req: Request, res: Response) => {
    res.json(await this.service.listPendingAppointments());
  };
}
