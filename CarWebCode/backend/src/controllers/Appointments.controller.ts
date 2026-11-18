import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../conf/dbConnection.ts";


const NOT_CANCELLABLE = ["Attended", "Completed", "Cancelled"];

export class AppointmentsController {
    constructor() {}

    // PATCH /appointments/:id/cancel
    // Body: { "userId": 1, "confirm": true, "reason": "opcional" }
    public async cancelAppointment(req: Request, res: Response) {
        const id = Number(req.params["id"]);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ message: "this id is not valid" });
            return;
        }

        const { userId, confirm, reason } = req.body ?? {};


        if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
            res.status(400).json({ message: "userId must be a positive integer" });
            return;
        }


        if (confirm !== true) {
            res.status(400).json({ message: "the cancellation must be confirmed" });
            return;
        }

        if (reason !== undefined && (typeof reason !== "string" || reason.trim().length > 255)) {
            res.status(400).json({ message: "reason must be a text of at most 255 characters" });
            return;
        }
        const cleanReason = typeof reason === "string" && reason.trim() ? reason.trim() : null;


        //both state and logs save, its both or none.
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();


            const [rows] = await connection.execute<RowDataPacket[]>(
                "select ClientId, Status from Appointment where AppointmentId = ? for update",
                [id],
            );
            const appointment = rows[0];


            if (!appointment || Number(appointment["ClientId"]) !== userId) {
                await connection.rollback();
                res.status(404).json({ message: "appointment has not been found" });
                return;
            }

            if (NOT_CANCELLABLE.includes(appointment["Status"])) {
                await connection.rollback();
                res.status(409).json({ message: `an appointment with status ${appointment["Status"]} cannot be cancelled` });
                return;
            }

            //frees the date
            await connection.execute(
                "update Appointment set Status = 'Cancelled', CancelReason = ? where AppointmentId = ?",
                [cleanReason, id],
            );

            //Log gets writen here
            await connection.execute(
                "insert into AppointmentLog (ClientId, AppointmentId, Action, Reason) values (?,?,?,?)",
                [userId, id, "Cancelled", cleanReason],
            );

            await connection.commit();
            res.status(200).json({ message: "appointment has been cancelled" });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        } finally {
            
            connection.release();
        }
    }
}