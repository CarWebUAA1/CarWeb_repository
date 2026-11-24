
import type { Request, Response } from "express";
import type { AppointmentService } from "../services/appointment.service.js";
import { parseCreateAppointment, parseRescheduleAppointment} from "../validators/appointment.js";
import type { AppointmentStatusAction } from "../dtos/appointments/AppointmentDto.js";
import { BadRequestError } from "../errors/HttpError.js";

export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

 
  create = async (req: Request, res: Response): Promise<void> => {
    const input = parseCreateAppointment(req.body);

    const appointment = await this.service.create(input);

    res.status(201).json({
      ok: true,
      message: "Appointment request created successfully.",
      data: appointment,
    });
  };
    
  listAll = async (_req: Request, res: Response): Promise<void> => {
    const appointments = await this.service.listAll();

    res.status(200).json({
      ok: true,
      data: appointments,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const appointmentId = Number(req.params.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      throw new BadRequestError("Invalid appointment ID");
    }

    const { status, reason } = req.body ?? {};

    const allowedStatuses: AppointmentStatusAction[] = [
      "Confirmed",
      "Rejected",
      "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestError("Invalid appointment status");
    }

    if (reason !== undefined && typeof reason !== "string") {
      throw new BadRequestError("Reason must be a string");
    }

    const staffId = Number(req.auth?.userId);

    if (!Number.isInteger(staffId) || staffId <= 0) {
      throw new BadRequestError("Invalid employee identity");
    }

    await this.service.updateStatus(
      appointmentId,
      status,
      staffId,
      reason
    );

    res.status(200).json({
      ok: true,
      message: "Appointment status updated successfully."
    });
  };
    
  reschedule = async (req: Request, res: Response): Promise<void> => {
    const appointmentId = Number(req.params.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      throw new BadRequestError("Invalid appointment ID");
    }

    const input = parseRescheduleAppointment(req.body);

    await this.service.reschedule(appointmentId, input);

    res.status(200).json({
      ok: true,
      message: "Appointment rescheduled successfully."
    });
  };
}
