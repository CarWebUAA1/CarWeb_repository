import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: string;
      };
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required"
    });
    return;
  }

  const token = authorization.split(" ")[1];
  const secret = process.env["JWT_SECRET"];

  if (!token || !secret) {
    res.status(401).json({
      error: "Invalid authentication"
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      !decoded.sub ||
      typeof decoded.role !== "string"
    ) {
      res.status(401).json({
        error: "Invalid token"
      });
      return;
    }

    req.auth = {
      userId: decoded.sub,
      role: decoded.role.toLowerCase()
    };

    next();

  } catch {
    res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}

export function requireManager(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.auth?.role !== "manager") {
    res.status(403).json({
      error: "Access denied. Manager role required."
    });
    return;
  }

  next();
}

export function requireStaff(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!["employee", "manager"].includes(req.auth?.role ?? "")) {
    res.status(403).json({
      error: "Access denied. Employee or manager role required."
    });
    return;
  }

  next();
}