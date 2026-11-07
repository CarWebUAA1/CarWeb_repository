// Body of POST /test-drives and the records the test drive endpoints return.
// Datetimes are "YYYY-MM-DD HH:mm:ss" in the dealership's local time (MySQL DATETIME).

export interface ScheduleTestDriveDto {
  appointmentId: number;
  employeeId: number;
  carId: number;
  scheduleStart: string;
  scheduleEnd: string;
}

export interface TestDriveDto extends ScheduleTestDriveDto {
  id: number;
}

/** A "Test drive" appointment that has no test drive scheduled yet. */
export interface PendingTestDriveAppointmentDto {
  appointmentId: number;
  clientName: string;
  appointmentDatetime: string;
  carId: number | null;
  car: string | null; // "Brand Model Year"
}

/** A scheduled test drive that has not finished yet. */
export interface UpcomingTestDriveDto {
  id: number;
  scheduleStart: string;
  scheduleEnd: string;
  carId: number;
  car: string;
  clientName: string;
  employeeName: string;
}
