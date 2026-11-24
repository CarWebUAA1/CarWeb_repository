// Mirrors backend/src/dtos/testDrives/TestDriveDto.ts.
// Datetimes are "YYYY-MM-DD HH:mm:ss" in the dealership's local time.

export interface ScheduleTestDriveRequest {
  appointmentId: number;
  employeeId: number;
  carId: number;
  scheduleStart: string; // also accepts "YYYY-MM-DDTHH:mm" (an <input type="datetime-local"> value)
  scheduleEnd: string;
}

export interface TestDrive extends ScheduleTestDriveRequest {
  id: number;
}

/** A "Test drive" appointment that has no test drive scheduled yet. */
export interface PendingTestDriveAppointment {
  appointmentId: number;
  clientName: string;
  appointmentDatetime: string;
  carId: number | null;
  car: string | null;
}

/** A scheduled test drive that has not finished yet. */
export interface UpcomingTestDrive {
  id: number;
  scheduleStart: string;
  scheduleEnd: string;
  carId: number;
  car: string;
  clientName: string;
  employeeName: string;
}
