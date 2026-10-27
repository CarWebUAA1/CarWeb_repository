import { BadRequestError } from "../errors/HttpError.js";

const POSITIVE_INT = /^[1-9]\d*$/;

function parsePositiveInt(value: unknown, field: string): number {
  if (typeof value !== "string" || !POSITIVE_INT.test(value)) {
    throw new BadRequestError(`${field} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new BadRequestError(`${field} is too large`);
  return parsed;
}

export function parsePage(value: unknown): number {
  return value === undefined ? 1 : parsePositiveInt(value, "page");
}

export function parseCarId(value: unknown): number {
  return parsePositiveInt(value, "id");
}
