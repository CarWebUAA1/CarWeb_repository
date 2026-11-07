import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../conf/dbConnection.ts";

// Customers have no account (they only book appointments), so there is no registration:
// staff accounts are created in the database (see sql/seed.sql).

// Same message for unknown email or wrong password,
// so the response never reveals which field was wrong (LogIn story).
const INVALID_CREDENTIALS = "Invalid email or password.";

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      res.status(400).json({ ok: false, message: "Email and password are required." });
      return;
    }

    // Only staff have accounts (customers do not log in). The email collation ignores case.
    const [rows] = await pool.execute(
      "SELECT staff_id, name, email, password_hash, role FROM staff WHERE email = ? LIMIT 1",
      [email.trim()]
    );
    const user = (rows as any[])[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ ok: false, message: INVALID_CREDENTIALS });
      return;
    }

    res.json({
      ok: true,
      message: "Login successful.",
      // The API keeps sending the role in lowercase ('employee' | 'manager'), as the frontend expects.
      user: { id: user.staff_id, name: user.name, email: user.email, role: String(user.role).toLowerCase() }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ ok: false, message: "Internal error while logging in." });
  }
}
