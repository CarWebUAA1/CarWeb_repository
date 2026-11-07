import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  PendingTestDriveAppointmentDto,
  ScheduleTestDriveDto,
  TestDriveDto,
  UpcomingTestDriveDto,
} from "../dtos/testDrives/TestDriveDto.js";

export type ScheduleFailure =
  | "car-not-found"
  | "employee-not-found"
  | "appointment-not-found"
  | "not-a-test-drive-appointment"
  | "appointment-already-has-test-drive";

export interface OverlappingTestDrive {
  id: number;
  scheduleStart: string;
  scheduleEnd: string;
}

export type ScheduleResult =
  | { ok: true; testDrive: TestDriveDto }
  | { ok: false; reason: ScheduleFailure }
  | { ok: false; reason: "overlap"; overlapping: OverlappingTestDrive };

export interface TestDriveRepository {
  /** Inserts the test drive only if the car is free in that time range. Check and insert are atomic. */
  scheduleIfFree(input: ScheduleTestDriveDto): Promise<ScheduleResult>;
  /** "Test drive" appointments from today on, pending or confirmed, without a test drive yet. */
  listPendingAppointments(): Promise<PendingTestDriveAppointmentDto[]>;
  /** Test drives that have not finished yet, earliest first. */
  listUpcoming(): Promise<UpcomingTestDriveDto[]>;
}

interface PendingAppointmentRow extends RowDataPacket {
  appointment_id: number;
  client_name: string;
  appointment_datetime: string;
  car_id: number | null;
  car: string | null;
}

interface UpcomingRow extends RowDataPacket {
  test_drive_id: number;
  schedule_start: string;
  schedule_end: string;
  car_id: number;
  car: string;
  client_name: string;
  employee_name: string;
}

interface AppointmentRow extends RowDataPacket {
  appointment_type: string;
}

interface OverlapRow extends RowDataPacket {
  test_drive_id: number;
  schedule_start: string;
  schedule_end: string;
}

export class MySqlTestDriveRepository implements TestDriveRepository {
  constructor(private readonly db: Pool) {}

  async scheduleIfFree(input: ScheduleTestDriveDto): Promise<ScheduleResult> {
    const conn = await this.db.getConnection();
    try {
      await conn.beginTransaction();
      const result = await this.schedule(conn, input);
      if (result.ok) await conn.commit();
      else await conn.rollback();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async listPendingAppointments(): Promise<PendingTestDriveAppointmentDto[]> {
    const [rows] = await this.db.query<PendingAppointmentRow[]>(
      `SELECT a.appointment_id, a.client_name,
              DATE_FORMAT(a.appointment_datetime, '%Y-%m-%d %H:%i:%s') AS appointment_datetime,
              a.car_id, CONCAT(c.brand, ' ', c.model, ' ', c.year) AS car
         FROM appointments a
         LEFT JOIN cars c ON c.car_id = a.car_id
        WHERE a.appointment_type = 'Test drive'
          AND a.status IN ('Pending', 'Confirmed')
          AND a.appointment_datetime >= CURDATE()
          AND NOT EXISTS (SELECT 1 FROM test_drives td WHERE td.appointment_id = a.appointment_id)
        ORDER BY a.appointment_datetime`,
    );
    return rows.map((r) => ({
      appointmentId: r.appointment_id,
      clientName: r.client_name,
      appointmentDatetime: r.appointment_datetime,
      carId: r.car_id,
      car: r.car,
    }));
  }

  async listUpcoming(): Promise<UpcomingTestDriveDto[]> {
    const [rows] = await this.db.query<UpcomingRow[]>(
      `SELECT td.test_drive_id,
              DATE_FORMAT(td.schedule_start, '%Y-%m-%d %H:%i:%s') AS schedule_start,
              DATE_FORMAT(td.schedule_end, '%Y-%m-%d %H:%i:%s') AS schedule_end,
              td.car_id, CONCAT(c.brand, ' ', c.model, ' ', c.year) AS car,
              a.client_name, e.name AS employee_name
         FROM test_drives td
         JOIN cars c         ON c.car_id = td.car_id
         JOIN appointments a ON a.appointment_id = td.appointment_id
         JOIN employees e    ON e.employee_id = td.employee_id
        WHERE td.schedule_end >= NOW()
        ORDER BY td.schedule_start`,
    );
    return rows.map((r) => ({
      id: r.test_drive_id,
      scheduleStart: r.schedule_start,
      scheduleEnd: r.schedule_end,
      carId: r.car_id,
      car: r.car,
      clientName: r.client_name,
      employeeName: r.employee_name,
    }));
  }

  private async schedule(conn: PoolConnection, input: ScheduleTestDriveDto): Promise<ScheduleResult> {
    // Locking the car row serializes every scheduling for this car: two simultaneous
    // requests cannot both pass the overlap check and then both insert.
    const [cars] = await conn.query<RowDataPacket[]>("SELECT car_id FROM cars WHERE car_id = ? FOR UPDATE", [
      input.carId,
    ]);
    if (cars.length === 0) return { ok: false, reason: "car-not-found" };

    const [employees] = await conn.query<RowDataPacket[]>("SELECT employee_id FROM employees WHERE employee_id = ?", [
      input.employeeId,
    ]);
    if (employees.length === 0) return { ok: false, reason: "employee-not-found" };

    const [appointments] = await conn.query<AppointmentRow[]>(
      "SELECT appointment_type FROM appointments WHERE appointment_id = ?",
      [input.appointmentId],
    );
    const appointment = appointments[0];
    if (!appointment) return { ok: false, reason: "appointment-not-found" };
    if (appointment.appointment_type !== "Test drive") return { ok: false, reason: "not-a-test-drive-appointment" };

    const [existing] = await conn.query<RowDataPacket[]>("SELECT test_drive_id FROM test_drives WHERE appointment_id = ?", [
      input.appointmentId,
    ]);
    if (existing.length > 0) return { ok: false, reason: "appointment-already-has-test-drive" };

    // Two ranges overlap when each one starts before the other ends.
    // Touching ranges (one ends exactly when the other starts) are allowed.
    // Uses idx_test_drives_car_id_schedule_start.
    const [overlaps] = await conn.query<OverlapRow[]>(
      `SELECT test_drive_id,
              DATE_FORMAT(schedule_start, '%Y-%m-%d %H:%i:%s') AS schedule_start,
              DATE_FORMAT(schedule_end, '%Y-%m-%d %H:%i:%s') AS schedule_end
         FROM test_drives
        WHERE car_id = ?
          AND schedule_start < ?
          AND schedule_end > ?
        ORDER BY schedule_start
        LIMIT 1`,
      [input.carId, input.scheduleEnd, input.scheduleStart],
    );
    const overlap = overlaps[0];
    if (overlap) {
      return {
        ok: false,
        reason: "overlap",
        overlapping: { id: overlap.test_drive_id, scheduleStart: overlap.schedule_start, scheduleEnd: overlap.schedule_end },
      };
    }

    const [insert] = await conn.query<ResultSetHeader>(
      `INSERT INTO test_drives (appointment_id, employee_id, car_id, schedule_start, schedule_end)
       VALUES (?, ?, ?, ?, ?)`,
      [input.appointmentId, input.employeeId, input.carId, input.scheduleStart, input.scheduleEnd],
    );
    return { ok: true, testDrive: { id: insert.insertId, ...input } };
  }
}
