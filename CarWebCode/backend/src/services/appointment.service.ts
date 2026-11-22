import type {
  AppointmentListDto,
  AppointmentResponseDto,
  AppointmentStatusAction,
  CreateAppointmentDto,
  RescheduleAppointmentDto
} from "../dtos/appointments/AppointmentDto.js";
import { ConflictError, NotFoundError } from "../errors/HttpError.js";
import type { AppointmentRepository } from "../repositories/appointment.repository.js";
import { createHash, randomBytes } from "node:crypto";

export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}

  async create(
    input: CreateAppointmentDto
  ): Promise<AppointmentResponseDto> {
    // Generate a secure token and store only its SHA-256 hash.
    const manageToken = randomBytes(32).toString("hex");
    const manageTokenHash = createHash("sha256")
      .update(manageToken)
      .digest("hex");

    try {
      const appointmentId = await this.repository.create(
        input,
        manageTokenHash
      );

      return {
        appointmentId,
        status: "Pending",
      };

        } catch (error) {
      if (error instanceof Error && error.message === "CAR_NOT_FOUND") {
        throw new NotFoundError("Car not found");
      }

      if (error instanceof Error && error.message === "CAR_NOT_AVAILABLE") {
        throw new ConflictError("The car is not available for appointments");
      }

      if (
        error instanceof Error &&
        error.message === "DUPLICATE_APPOINTMENT"
      ) {
        throw new ConflictError(
          "You already have an appointment at this date and time"
        );
      }

      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      ) {
        throw new ConflictError(
          "An appointment already exists for this email and date and time"
        );
      }

      throw error;
    }
  }
  async listAll(): Promise<AppointmentListDto[]> {
    return this.repository.listAll();
}
  async updateStatus(
    appointmentId: number,
    status: AppointmentStatusAction,
    staffId: number,
    reason?: string
  ): Promise<void> {
    if (
      (status === "Rejected" || status === "Cancelled") &&
      (!reason || !reason.trim())
    ) {
      throw new ConflictError(
        "A reason is required to reject or cancel an appointment"
      );
    }

    const updated = await this.repository.updateStatus(
      appointmentId,
      status,
      staffId,
      reason?.trim()
    );

    if (!updated) {
      throw new ConflictError(
        "Appointment not found or its current status does not allow this action"
      );
    }
  }
    async reschedule(
    appointmentId: number,
    input: RescheduleAppointmentDto
  ): Promise<void> {
    const updated = await this.repository.reschedule(
      appointmentId,
      input.appointmentDatetime
    );

    if (!updated) {
      throw new ConflictError(
        "Appointment not found or its current status does not allow rescheduling"
      );
    }
  }
}
