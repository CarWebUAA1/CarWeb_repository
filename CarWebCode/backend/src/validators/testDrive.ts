import type { ScheduleTestDriveDto } from "../dtos/testDrives/TestDriveDto.js";
import { BadRequestError } from "../errors/HttpError.js";

// "YYYY-MM-DD HH:mm" or "YYYY-MM-DDTHH:mm", optional seconds. No time zone: MySQL DATETIME
// stores the dealership's local time, so the value is passed as text, never through a JS Date.
const DATETIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

function parseId(value: unknown, field: string): number {
  const parsed = typeof value === "string" && /^[1-9]\d*$/.test(value) ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 1) {
    throw new BadRequestError(`${field} must be a positive integer`);
  }
  return parsed;
}

/** Returns the datetime as "YYYY-MM-DD HH:mm:ss", rejecting impossible dates like 2026-02-30. */
function parseDatetime(value: unknown, field: string): string {
  const match = typeof value === "string" ? DATETIME.exec(value.trim()) : null;
  if (!match) throw new BadRequestError(`${field} must be a datetime like 2026-11-20 16:00`);
  const [, y, mo, d, h, mi, s = "00"] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  const sameValue =
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(mo) - 1 &&
    date.getDate() === Number(d) &&
    date.getHours() === Number(h) &&
    date.getMinutes() === Number(mi) &&
    date.getSeconds() === Number(s);
  if (!sameValue) throw new BadRequestError(`${field} is not a valid date and time`);
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

export function parseScheduleTestDrive(body: unknown): ScheduleTestDriveDto {
  const data = (body ?? {}) as Record<string, unknown>;
  const input: ScheduleTestDriveDto = {
    appointmentId: parseId(data["appointmentId"], "appointmentId"),
    employeeId: parseId(data["employeeId"], "employeeId"),
    carId: parseId(data["carId"], "carId"),
    scheduleStart: parseDatetime(data["scheduleStart"], "scheduleStart"),
    scheduleEnd: parseDatetime(data["scheduleEnd"], "scheduleEnd"),
  };
  // Same fixed format, so comparing the strings compares the datetimes.
  if (input.scheduleEnd <= input.scheduleStart) {
    throw new BadRequestError("scheduleEnd must be after scheduleStart");
  }
  return input;
}
