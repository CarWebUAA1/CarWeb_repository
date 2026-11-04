import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../conf/dbConnection.ts";

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { Name, Phone, Email, Password } = req.body ?? {};

    if (!Name || !Email || !Password) {
      res.status(400).json({ ok: false, message: "Name, Email and Password are required." });
      return;
    }
    if (typeof Email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
      res.status(400).json({ ok: false, message: "The email address is not valid." });
      return;
    }
    if (typeof Password !== "string" || Password.length < 8) {
      res.status(400).json({ ok: false, message: "The password must be at least 8 characters long." });
      return;
    }

    const [existing] = await pool.execute(
      "SELECT UserId FROM User WHERE Email = ? LIMIT 1",
      [Email.trim().toLowerCase()]
    );
    if ((existing as any[]).length > 0) {
      res.status(409).json({ ok: false, message: "An account with that email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(Password, 12);
    const [result] = await pool.execute(
      "INSERT INTO User (Name, Phone, Email, Password) VALUES (?, ?, ?, ?)",
      [String(Name).trim(), Phone ? String(Phone).trim() : null, Email.trim().toLowerCase(), passwordHash]
    );

    res.status(201).json({
      ok: true,
      message: "User registered successfully.",
      userId: (result as any).insertId
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ ok: false, message: "Internal error while registering the user." });
  }
}

// Same message for unknown email, wrong password or inactive account,
// so the response never reveals which field was wrong (LogIn story).
const INVALID_CREDENTIALS = "Invalid email or password.";

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      res.status(400).json({ ok: false, message: "Email and password are required." });
      return;
    }

    // Emails are stored trimmed and lowercased by registerUser.
    const [rows] = await pool.execute(
      "SELECT UserId, Name, Email, Password, role, IsActive FROM User WHERE Email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );
    const user = (rows as any[])[0];

    if (!user || !user.IsActive || !(await bcrypt.compare(password, user.Password))) {
      res.status(401).json({ ok: false, message: INVALID_CREDENTIALS });
      return;
    }

    res.json({
      ok: true,
      message: "Login successful.",
      user: { id: user.UserId, name: user.Name, email: user.Email, role: user.role }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ ok: false, message: "Internal error while logging in." });
  }
}
