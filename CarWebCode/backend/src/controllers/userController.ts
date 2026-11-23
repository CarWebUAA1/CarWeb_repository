import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../conf/dbConnection.ts";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

const INVALID_CREDENTIALS = "Invalid email or password.";
const STAFF_ROLES = ["employee", "manager"] as const;

interface StaffRow extends RowDataPacket {
  staff_id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
}

function isValidStaffInput(
  name: unknown,
  phone: unknown,
  email: unknown,
  role: unknown
): name is string {
  return (
    typeof name === "string" &&
    !!name.trim() &&
    name.trim().length <= 100 &&
    typeof phone === "string" &&
    !!phone.trim() &&
    phone.trim().length <= 15 &&
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    email.trim().length <= 255 &&
    typeof role === "string" &&
    STAFF_ROLES.includes(role.toLowerCase() as (typeof STAFF_ROLES)[number])
  );
}

function databaseConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["ER_DUP_ENTRY", "ER_ROW_IS_REFERENCED_2"].includes(String(error.code))
  );
}

export async function listStaff(req: Request, res: Response): Promise<void> {
  try {
    const search = typeof req.query["search"] === "string"
      ? req.query["search"].trim()
      : "";
    const searchPattern = `%${search}%`;
    const [rows] = await pool.execute<StaffRow[]>(
      `SELECT staff_id, name, phone, email, LOWER(role) AS role
       FROM staff
       WHERE ? = '' OR name LIKE ? OR CAST(staff_id AS CHAR) LIKE ?
       ORDER BY name, staff_id`,
      [search, searchPattern, searchPattern]
    );

    res.json({
      staff: rows.map((member) => ({
        id: member.staff_id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        role: member.role
      }))
    });
  } catch (error) {
    console.error("Error listing staff:", error);
    res.status(500).json({ message: "Could not load staff." });
  }
}

export async function registerStaff(req: Request, res: Response): Promise<void> {
  const { name, phone, email, password, role } = req.body ?? {};

  if (
    !isValidStaffInput(name, phone, email, role) ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    res.status(400).json({
      message: "Enter a valid name, phone, email, role, and password (at least 8 characters)."
    });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO staff (name, phone, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), phone.trim(), email.trim(), passwordHash, role.toLowerCase()]
    );

    res.status(201).json({
      message: "Staff member registered.",
      staffId: result.insertId
    });
  } catch (error) {
    if (databaseConflict(error)) {
      res.status(409).json({ message: "Email is already in use or the staff member is referenced by existing records." });
      return;
    }

    console.error("Error registering staff:", error);
    res.status(500).json({ message: "Could not register staff member." });
  }
}

export async function updateStaff(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);
  const { name, phone, email, password, role } = req.body ?? {};

  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !isValidStaffInput(name, phone, email, role) ||
    (password !== undefined && (typeof password !== "string" || (password !== "" && password.length < 8)))
  ) {
    res.status(400).json({ message: "Enter valid staff details. A new password must have at least 8 characters." });
    return;
  }

  try {
    const fields: Array<string | number> = [name.trim(), phone.trim(), email.trim(), role.toLowerCase()];
    const passwordSql = typeof password === "string" && password
      ? ", password_hash = ?"
      : "";
    if (passwordSql) fields.push(await bcrypt.hash(password, 10));

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE staff
       SET name = ?, phone = ?, email = ?, role = ?${passwordSql}
       WHERE staff_id = ?`,
      [...fields, id]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.execute<StaffRow[]>(
        "SELECT staff_id FROM staff WHERE staff_id = ?",
        [id]
      );
      if (rows.length === 0) {
        res.status(404).json({ message: "Staff member not found." });
        return;
      }
    }
    res.json({ message: "Staff details updated." });
  } catch (error) {
    if (databaseConflict(error)) {
      res.status(409).json({ message: "Email is already in use or the role cannot change while the staff member has related records." });
      return;
    }

    console.error("Error updating staff:", error);
    res.status(500).json({ message: "Could not update staff member." });
  }
}

export async function getOwnStaff(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.auth?.userId);
    const [rows] = await pool.execute<StaffRow[]>(
      `SELECT staff_id, name, phone, email, LOWER(role) AS role
       FROM staff WHERE staff_id = ? LIMIT 1`,
      [id]
    );
    const member = rows[0];
    if (!member) {
      res.status(404).json({ message: "Staff member not found." });
      return;
    }
    res.json({
      staff: {
        id: member.staff_id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        role: member.role
      }
    });
  } catch (error) {
    console.error("Error loading staff profile:", error);
    res.status(500).json({ message: "Could not load profile." });
  }
}

export async function updateOwnStaff(req: Request, res: Response): Promise<void> {
  const id = Number(req.auth?.userId);
  const { name, phone, email, password } = req.body ?? {};

  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100 ||
    typeof phone !== "string" ||
    !phone.trim() ||
    phone.trim().length > 15 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.trim().length > 255 ||
    (password !== undefined && (typeof password !== "string" || (password !== "" && password.length < 8)))
  ) {
    res.status(400).json({ message: "Enter valid name, phone, email, and a password with at least 8 characters." });
    return;
  }

  try {
    const fields: Array<string | number> = [name.trim(), phone.trim(), email.trim()];
    const passwordSql = typeof password === "string" && password ? ", password_hash = ?" : "";
    if (passwordSql) fields.push(await bcrypt.hash(password, 10));

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE staff SET name = ?, phone = ?, email = ?${passwordSql} WHERE staff_id = ?`,
      [...fields, id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Staff member not found." });
      return;
    }

    res.json({ message: "Your profile was updated." });
  } catch (error) {
    if (databaseConflict(error)) {
      res.status(409).json({ message: "That email is already in use." });
      return;
    }
    console.error("Error updating staff profile:", error);
    res.status(500).json({ message: "Could not update your profile." });
  }
}

export async function deleteStaff(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);
  const currentId = Number(req.auth?.userId);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ message: "Invalid staff ID." });
    return;
  }
  if (id === currentId) {
    res.status(400).json({ message: "A manager cannot deactivate their own account." });
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM staff WHERE staff_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Staff member not found." });
      return;
    }
    res.json({ message: "Staff account deactivated." });
  } catch (error) {
    if (databaseConflict(error)) {
      res.status(409).json({ message: "The account could not be removed because it has related records." });
      return;
    }
    console.error("Error deleting staff:", error);
    res.status(500).json({ message: "Could not deactivate the staff account." });
  }
}

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