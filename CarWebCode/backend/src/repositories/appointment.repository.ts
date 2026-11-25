
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  AppointmentListDto,
  AppointmentType,
  AppointmentStatusAction,
  CreateAppointmentDto
} from "../dtos/appointments/AppointmentDto.js";

export interface AppointmentRepository {
  create(
    appointment: CreateAppointmentDto,
    manageTokenHash: string
  ): Promise<number>;

  listAll(): Promise<AppointmentListDto[]>;

  updateStatus(
    appointmentId: number,
    status: AppointmentStatusAction,
    staffId: number,
    reason?: string
  ): Promise<boolean>;

  reschedule(
    appointmentId: number,
    appointmentDatetime: string
  ): Promise<boolean>;
}

interface CarAvailabilityRow extends RowDataPacket {
  car_id: number;
  status: string;
}

interface AppointmentListRow extends RowDataPacket {
  appointment_id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  car_id: number | null;
  car: string | null;
  appointment_type: string;
  appointment_datetime: string;
  status: string;
  employee_id: number | null;
  employee_name: string | null;
  created_at: string;
}

export class MySqlAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: Pool) {}

  async create(
    appointment: CreateAppointmentDto,
    manageTokenHash: string
  ): Promise<number> {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      // A sale evaluation may have no car yet; any other appointment needs an available one.
      let car: CarAvailabilityRow | undefined;
      if (appointment.carId !== null) {
        const [cars] = await connection.execute<CarAvailabilityRow[]>(
          `SELECT car_id, status
           FROM cars
           WHERE car_id = ?
           FOR UPDATE`,
          [appointment.carId]
        );

        car = cars[0];

        if (!car) {
          throw new Error("CAR_NOT_FOUND");
        }
      }
      const [existingAppointments] = await connection.execute<RowDataPacket[]>(
        `SELECT appointment_id
        FROM appointments
        WHERE client_email = ?
        AND appointment_datetime = ?
        AND status IN ('Pending', 'Confirmed')
        LIMIT 1`,
     [
       appointment.clientEmail,
       appointment.appointmentDatetime
     ]
);

if (existingAppointments.length > 0) {
  throw new Error("DUPLICATE_APPOINTMENT");
}

      if (car && car.status !== "Available") {
        throw new Error("CAR_NOT_AVAILABLE");
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO appointments (
          client_name,
          client_phone,
          client_email,
          manage_token_hash,
          car_id,
          appointment_type,
          appointment_datetime
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          appointment.clientName,
          appointment.clientPhone,
          appointment.clientEmail,
          manageTokenHash,
          appointment.carId,
          appointment.appointmentType,
          appointment.appointmentDatetime
        ]
      );

      await connection.commit();

      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async listAll(): Promise<AppointmentListDto[]> {
    const [rows] = await this.db.query<AppointmentListRow[]>(
      `SELECT
         a.appointment_id,
         a.client_name,
         a.client_phone,
         a.client_email,
         a.car_id,
         CASE
           WHEN c.car_id IS NOT NULL
           THEN CONCAT(c.brand, ' ', c.model, ' ', c.year)
           ELSE NULL
         END AS car,
         a.appointment_type,
         DATE_FORMAT(
           a.appointment_datetime,
           '%Y-%m-%d %H:%i:%s'
         ) AS appointment_datetime,
         a.status,
         a.employee_id,
         s.name AS employee_name,
         DATE_FORMAT(
           a.created_at,
           '%Y-%m-%d %H:%i:%s'
         ) AS created_at
       FROM appointments a
       LEFT JOIN cars c ON c.car_id = a.car_id
       LEFT JOIN staff s ON s.staff_id = a.employee_id
       ORDER BY a.appointment_datetime DESC`
    );

    return rows.map((row) => ({
      appointmentId: row.appointment_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      carId: row.car_id,
      car: row.car,
      appointmentType: row.appointment_type as AppointmentType,
      appointmentDatetime: row.appointment_datetime,
      status: row.status,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      createdAt: row.created_at
    }));
  }

  async updateStatus(
    appointmentId: number,
    status: AppointmentStatusAction,
    staffId: number,
    reason?: string
  ): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `UPDATE appointments
       SET
         status = ?,
         decision_by = ?,
         cancel_reason = ?,
         -- whoever confirms becomes the responsible employee, unless one was already assigned
         employee_id = IF(? = 'Confirmed', COALESCE(employee_id, ?), employee_id)
       WHERE appointment_id = ?
         AND (
           (status = 'Pending'
             AND ? IN ('Confirmed', 'Rejected', 'Cancelled'))
           OR
           (status = 'Confirmed' AND ? = 'Cancelled')
         )`,
      [
        status,
        staffId,
        status === "Confirmed" ? null : reason ?? null,
        status,
        staffId,
        appointmentId,
        status,
        status
      ]
    );

    return result.affectedRows > 0;
  }

  async reschedule(
    appointmentId: number,
    appointmentDatetime: string
  ): Promise<boolean> {
        const [result] = await this.db.execute<ResultSetHeader>(
      `UPDATE appointments AS current
       LEFT JOIN appointments AS existing
         ON existing.client_email = current.client_email
         AND existing.appointment_datetime = ?
         AND existing.status IN ('Pending', 'Confirmed')
         AND existing.appointment_id <> current.appointment_id
       SET current.appointment_datetime = ?
       WHERE current.appointment_id = ?
         AND current.status IN ('Pending', 'Confirmed')
         AND existing.appointment_id IS NULL`,
      [appointmentDatetime, appointmentDatetime, appointmentId]
    );
      

    return result.affectedRows > 0;
  }
}
