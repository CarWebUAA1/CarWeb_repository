import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../conf/dbConnection.ts";

interface UserRow extends RowDataPacket {
    Userid: number;
    Email: string;
}

export const registrarUsuario = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { Name, Phone, Email, Password } = req.body;

        if (
            typeof Name !== "string" ||
            typeof Email !== "string" ||
            typeof Password !== "string" ||
            !Name.trim() ||
            !Email.trim() ||
            !Password
        ) {
            res.status(400).json({
                mensaje: "Nombre, correo y contraseña son obligatorios."
            });
            return;
        }

        const nombre = Name.trim();
        const correo = Email.trim().toLowerCase();

        if (nombre.length > 150 || correo.length > 150) {
            res.status(400).json({
                mensaje: "El nombre o el correo exceden la longitud permitida."
            });
            return;
        }

        if (Password.length < 8) {
            res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres."
            });
            return;
        }

        const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoCorreo.test(correo)) {
            res.status(400).json({
                mensaje: "El correo electrónico no tiene un formato válido."
            });
            return;
        }

        let telefono: string | null = null;

        if (Phone !== undefined && Phone !== null && Phone !== "") {
            if (
                typeof Phone !== "string" &&
                typeof Phone !== "number"
            ) {
                res.status(400).json({
                    mensaje: "El teléfono no es válido."
                });
                return;
            }

            telefono = String(Phone).trim();

            if (!/^[0-9+() -]{7,20}$/.test(telefono)) {
                res.status(400).json({
                    mensaje: "El teléfono debe tener entre 7 y 20 caracteres válidos."
                });
                return;
            }
        }

        const [usuarios] = await pool.execute<UserRow[]>(
            "SELECT UserId, Email FROM `User` WHERE Email = ? LIMIT 1",
            [correo]
        );

        if (usuarios.length > 0) {
            res.status(409).json({
                mensaje: "Este correo electrónico ya está registrado."
            });
            return;
        }

        const passwordHash = await bcrypt.hash(Password, 12);

        const [resultado] = await pool.execute<ResultSetHeader>(
            `INSERT INTO \`user\`
                (Name, Phone, Email, Password, role, LastActivity, IsActive)
             VALUES (?, ?, ?, ?, 'client', 0, TRUE)`,
            [nombre, telefono, correo, passwordHash]
        );

        res.status(201).json({
            mensaje: "Usuario registrado correctamente.",
            usuario: {
                UserId: resultado.insertId,
                Name: nombre,
                Phone: telefono,
                Email: correo,
                role: "client",
                LastActivity: 0,
                IsActive: true
            }
        });

    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ER_DUP_ENTRY"
        ) {
            res.status(409).json({
                mensaje: "Este correo electrónico ya está registrado."
            });
            return;
        }

        console.error("Error al registrar usuario:", error);

        res.status(500).json({
            mensaje: "Ocurrió un error interno al registrar el usuario."
        });
    }
};