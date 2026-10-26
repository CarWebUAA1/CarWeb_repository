import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../conf/dbConnection.ts";

export async function registrarUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { Name, Phone, Email, Password } = req.body ?? {};

    if (!Name || !Email || !Password) {
      res.status(400).json({ ok: false, message: "Name, Email y Password son obligatorios." });
      return;
    }
    if (typeof Email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
      res.status(400).json({ ok: false, message: "El correo electrónico no es válido." });
      return;
    }
    if (typeof Password !== "string" || Password.length < 8) {
      res.status(400).json({ ok: false, message: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }

    const [existing] = await pool.execute(
      "SELECT UserId FROM user WHERE Email = ? LIMIT 1",
      [Email.trim().toLowerCase()]
    );
    if ((existing as any[]).length > 0) {
      res.status(409).json({ ok: false, message: "Ya existe una cuenta con ese correo." });
      return;
    }

    const passwordHash = await bcrypt.hash(Password, 12);
    const [result] = await pool.execute(
      "INSERT INTO User (Name, Phone, Email, Password) VALUES (?, ?, ?, ?)",
      [String(Name).trim(), Phone ? String(Phone).trim() : null, Email.trim().toLowerCase(), passwordHash]
    );

    res.status(201).json({
      ok: true,
      message: "Usuario registrado correctamente.",
      userId: (result as any).insertId
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ ok: false, message: "Error interno al registrar el usuario." });
  }
}
