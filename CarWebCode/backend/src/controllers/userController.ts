import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../conf/dbConnection.ts";

const INVALID_CREDENTIALS = "Invalid email or password.";

export async function loginUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        ok: false,
        message: "Email and password are required."
      });
      return;
    }

    const [rows] = await pool.execute(
      `SELECT staff_id, name, email, password_hash, role
       FROM staff
       WHERE email = ?
       LIMIT 1`,
      [email.trim()]
    );

    const user = (rows as any[])[0];

    if (
      !user ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      res.status(401).json({
        ok: false,
        message: INVALID_CREDENTIALS
      });
      return;
    }

    const role = String(user.role).toLowerCase();

    const secret = process.env["JWT_SECRET"];

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        role: role
      },
      secret,
      {
        subject: String(user.staff_id),
        expiresIn: "8h"
      }
    );

    res.json({
      ok: true,
      message: "Login successful.",
      token,
      user: {
        id: user.staff_id,
        name: user.name,
        email: user.email,
        role
      }
    });

  } catch (error) {
    console.error("Error logging in:", error);

    res.status(500).json({
      ok: false,
      message: "Internal error while logging in."
    });
  }
}