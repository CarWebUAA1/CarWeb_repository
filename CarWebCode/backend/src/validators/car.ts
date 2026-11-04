import { BadRequestError } from "../errors/HttpError.js";
import type { CarFilters } from "../repositories/carFilters.js";

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

export const MAX_FILTER_LENGTH = 100;

/** Optional text filter: trimmed, `undefined` when missing or blank, 400 when repeated or too long. */
function parseTextFilter(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new BadRequestError(`${field} must be a single text value`);
  const trimmed = value.trim();
  if (trimmed.length > MAX_FILTER_LENGTH) {
    throw new BadRequestError(`${field} must be at most ${MAX_FILTER_LENGTH} characters`);
  }
  return trimmed || undefined;
}

export function parseCarFilters(query: Record<string, unknown>): CarFilters {
  return {
    search: parseTextFilter(query["search"], "search"),
    brand: parseTextFilter(query["brand"], "brand"),
    model: parseTextFilter(query["model"], "model"),
  };
}
