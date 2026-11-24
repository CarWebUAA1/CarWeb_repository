import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../conf/dbConnection.js";


const MODIFIABLE = ["Pending", "Confirmed"];
const TWO_HOURS = 2 * 60 * 60 * 1000;

// Date -> "YYYY-MM-DD HH:MM:00", the format MySQL uses for DATETIME
function toSqlDatetime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export class AppointmentsController {
    constructor() {}

    // PATCH /appointments/:id/modify
    // Body: { "token": "token from the email link", "newDatetime": "2026-11-25 10:30" }
    public async modifyAppointment(req: Request, res: Response) {
    // PATCH /appointments/:id/cancel
    // Body: { "userId": 1, "confirm": true, "reason": "opcional" }
    public async cancelAppointment(req: Request, res: Response) {
        const id = Number(req.params["id"]);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ message: "this id is not valid" });
            return;
        }

        const { token, newDatetime } = req.body ?? {};

        // customers have no account: the token in their email link proves the appointment is theirs
        if (typeof token !== "string" || !token.trim()) {
            res.status(400).json({ message: "token is required" });
            return;
        }

        if (typeof newDatetime !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(newDatetime)) {
            res.status(400).json({ message: "newDatetime must have the format YYYY-MM-DD HH:MM" });
            return;
        }

        // rejects dates that do not exist, like 2026-02-31 or 25:00
        const newDate = new Date(newDatetime.replace(" ", "T"));
        const newSlot = `${newDatetime}:00`;
        if (Number.isNaN(newDate.getTime()) || toSqlDatetime(newDate) !== newSlot) {
            res.status(400).json({ message: "newDatetime is not a valid date" });
            return;
        }

        // same window as "Schedule an appointment": from tomorrow up to 30 days ahead
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const lastDay = new Date(tomorrow);
        lastDay.setDate(lastDay.getDate() + 30);
        if (newDate < tomorrow || newDate >= lastDay) {
            res.status(400).json({ message: "the new date must be between tomorrow and 30 days from today" });
            return;
        }


        //the change, the notification and the log save together: all or nothing
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.execute<RowDataPacket[]>(
                "select client_email, employee_id, car_id, status, DATE_FORMAT(appointment_datetime, '%Y-%m-%d %H:%i:%s') as appointment_datetime from appointments where appointment_id = ? and manage_token_hash = SHA2(?, 256) for update",
                [id, token.trim()],
            );
            const appointment = rows[0];

            //wrong id or wrong token: same answer, so nobody can guess other appointments
            if (!appointment) {
                await connection.rollback();
                res.status(404).json({ message: "appointment has not been found" });
                return;
            }

            if (!MODIFIABLE.includes(appointment["status"])) {
                await connection.rollback();
                res.status(409).json({ message: `an appointment with status ${appointment["status"]} cannot be modified` });
                return;
            }

            const previousSlot: string = appointment["appointment_datetime"];
            const previousDate = new Date(previousSlot.replace(" ", "T"));
            if (previousDate.getTime() - Date.now() < TWO_HOURS) {
                await connection.rollback();
                res.status(409).json({ message: "appointments cannot be changed less than 2 hours before, please call the dealership" });
                return;
            }

            if (previousSlot === newSlot) {
                await connection.rollback();
                res.status(400).json({ message: "the new time is the same as the current one" });
                return;
            }

            //the slot is taken if the customer already has an appointment at that time,
            //or the car or the employee is busy with another active appointment
            const [taken] = await connection.execute<RowDataPacket[]>(
                "select appointment_id from appointments where appointment_datetime = ? and appointment_id <> ? and (client_email = ? or (status in ('Pending', 'Confirmed') and (car_id = ? or employee_id = ?)))",
                [newSlot, id, appointment["client_email"], appointment["car_id"], appointment["employee_id"]],
            );
            if (taken[0]) {
                await connection.rollback();
                res.status(409).json({ message: "the new time slot is not available, please choose another one" });
                return;
            }

            //moving the appointment frees the previous slot; it goes back to Pending
            await connection.execute(
                "update appointments set appointment_datetime = ?, status = 'Pending', decision_by = NULL where appointment_id = ?",
                [newSlot, id],
            );

            //notifies the assigned employee, if there is one
            if (appointment["employee_id"]) {
                await connection.execute(
                    "insert into notifications (staff_id, message) values (?, ?)",
                    [appointment["employee_id"], `Appointment ${id} was moved from ${previousSlot} to ${newSlot}`],
                );
            }

            //log: log_date is filled by MySQL with the local date and time
            await connection.execute(
                "insert into appointment_logs (client_email, appointment_id, action, previous_datetime, new_datetime) values (?,?,?,?,?)",
                [appointment["client_email"], id, "Modified", previousSlot, newSlot],
            );

            await connection.commit();
            res.status(200).json({
                message: "appointment has been modified",
                appointmentId: id,
                previousDatetime: previousSlot,
                newDatetime: newSlot,
                status: "Pending",
            });
        } catch (error) {
            //any error: nothing is saved, the original appointment stays as it was
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        } finally {
            
            connection.release();
        }
    }
}