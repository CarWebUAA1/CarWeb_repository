import type {
  PendingTestDriveAppointmentDto,
  ScheduleTestDriveDto,
  TestDriveDto,
  UpcomingTestDriveDto,
} from "../dtos/testDrives/TestDriveDto.js";
import { ConflictError, NotFoundError } from "../errors/HttpError.js";
import type { ScheduleFailure, TestDriveRepository } from "../repositories/testDrive.repository.js";

const FAILURES: Record<ScheduleFailure, () => Error> = {
  "car-not-found": () => new NotFoundError("Car not found"),
  "staff-not-found": () => new NotFoundError("Staff member not found"),
  "appointment-not-found": () => new NotFoundError("Appointment not found"),
  "not-a-test-drive-appointment": () => new ConflictError("The appointment is not a test drive appointment"),
  "appointment-already-has-test-drive": () => new ConflictError("The appointment already has a test drive"),
};

export class TestDriveService {
  constructor(private readonly repository: TestDriveRepository) {}

  /** Schedules a test drive; fails with 409 if the car already has one in that time range. */
  async schedule(input: ScheduleTestDriveDto): Promise<TestDriveDto> {
    const result = await this.repository.scheduleIfFree(input);
    if (result.ok) return result.testDrive;
    if (result.reason === "overlap") {
      const { scheduleStart, scheduleEnd } = result.overlapping;
      throw new ConflictError(`The car already has a test drive from ${scheduleStart} to ${scheduleEnd}`);
    }
    throw FAILURES[result.reason]();
  }

  listPendingAppointments(): Promise<PendingTestDriveAppointmentDto[]> {
    return this.repository.listPendingAppointments();
  }

  listUpcoming(): Promise<UpcomingTestDriveDto[]> {
    return this.repository.listUpcoming();
  }
}
