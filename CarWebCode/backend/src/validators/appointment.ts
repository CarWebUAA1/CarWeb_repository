
import type {CreateAppointmentDto, AppointmentType, RescheduleAppointmentDto} from "../dtos/appointments/AppointmentDto.js";import { BadRequestError } from "../errors/HttpError.js";

const DATETIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

const APPOINTMENT_TYPES: AppointmentType[] = [
  "Viewing",
  "Test drive",
  "Purchase"
];

function parseId(value: unknown, field: string): number {
  const parsed =
    typeof value === "string" && /^[1-9]\d*$/.test(value)
      ? Number(value)
      : value;

  if (
    typeof parsed !== "number" ||
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    throw new BadRequestError(`${field} must be a positive integer`);
  }

  return parsed;
}

function parseDatetime(value: unknown, field: string): string {
  const match = typeof value === "string"
    ? DATETIME.exec(value.trim())
    : null;

  if (!match) {
    throw new BadRequestError(
      `${field} must be a valid datetime`
    );
  }

  const [, y, mo, d, h, mi, s = "00"] = match;

  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s)
  );

  const isValid =
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(mo) - 1 &&
    date.getDate() === Number(d) &&
    date.getHours() === Number(h) &&
    date.getMinutes() === Number(mi) &&
    date.getSeconds() === Number(s);

  if (!isValid) {
    throw new BadRequestError(
      `${field} is not a valid date and time`
    );
  }
    const now = new Date();

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  if (date <= now) {
    throw new BadRequestError(
      `${field} must be a future date and time`
    );
  }

  if (date > maxDate) {
    throw new BadRequestError(
      `${field} must be within the next 30 days`
    );
  }

  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  // Sunday: no service.
  if (day === 0) {
    throw new BadRequestError(
      "Appointments are not available on Sundays"
    );
  }

  // Saturday: 9:00 AM to 3:00 PM.
  if (day === 6 && (minutes < 540 || minutes > 900)) {
    throw new BadRequestError(
      "Saturday appointments must be between 9:00 AM and 3:00 PM"
    );
  }

  // Monday to Friday: 9:00 AM to 5:00 PM.
  if (day >= 1 && day <= 5 && (minutes < 540 || minutes > 1020)) {
    throw new BadRequestError(
      "Weekday appointments must be between 9:00 AM and 5:00 PM"
    );
  }

  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

export function parseCreateAppointment(
  body: unknown
): CreateAppointmentDto {
  const data = (body ?? {}) as Record<string, unknown>;

  const clientName =
    typeof data["clientName"] === "string"
      ? data["clientName"].trim()
      : "";

  const clientPhone =
    typeof data["clientPhone"] === "string"
      ? data["clientPhone"].trim()
      : "";

  const clientEmail =
    typeof data["clientEmail"] === "string"
      ? data["clientEmail"].trim()
      : "";

  const appointmentType = data["appointmentType"];

  if (!clientName || clientName.length > 100) {
    throw new BadRequestError(
      "clientName is required and must not exceed 100 characters"
    );
  }

  if (!/^[0-9+\-()\s]{7,15}$/.test(clientPhone)) {
    throw new BadRequestError("clientPhone must be a valid phone number");
  }

  if (
    !clientEmail ||
    clientEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)
  ) {
    throw new BadRequestError("clientEmail must be a valid email address");
  }

  if (
    typeof appointmentType !== "string" ||
    !APPOINTMENT_TYPES.includes(appointmentType as AppointmentType)
  ) {
    throw new BadRequestError("Invalid appointmentType");
  }

  return {
    clientName,
    clientPhone,
    clientEmail,
    carId: parseId(data["carId"], "carId"),
    appointmentType: appointmentType as AppointmentType,
    appointmentDatetime: parseDatetime(
      data["appointmentDatetime"],
      "appointmentDatetime"
    )
  };
}

export function parseRescheduleAppointment(
  body: unknown
): RescheduleAppointmentDto {
  const data = (body ?? {}) as Record<string, unknown>;

  return {
    appointmentDatetime: parseDatetime(
      data["appointmentDatetime"],
      "appointmentDatetime"
    )
  };
}
