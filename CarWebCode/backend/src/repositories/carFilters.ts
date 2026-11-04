import { CAR_STATUS } from "../constants/carStatus.js";

/** Optional catalog filters (US-04). Empty values are never passed here: the validator drops them. */
export interface CarFilters {
  /** Free text: every word must appear in the brand or the model. */
  search?: string | undefined;
  /** Exact brand. */
  brand?: string | undefined;
  /** Exact model. */
  model?: string | undefined;
}

export interface SqlCondition {
  where: string;
  params: unknown[];
}

/** Escapes LIKE wildcards so a search for "50%" or "a_b" is taken literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Builds the WHERE clause of the public catalog: only available cars in inventory,
 * plus the optional filters.
 *
 * Case and accents are ignored by the column collation (utf8mb4_0900_ai_ci in MySQL 8,
 * utf8mb4_unicode_ci in MariaDB), so "MÁZDA" matches "Mazda".
 */
export function buildCatalogCondition(filters: CarFilters, alias = "c"): SqlCondition {
  const conditions = [`${alias}.StatusOfCar = ?`, `${alias}.InventoryStatus = TRUE`];
  const params: unknown[] = [CAR_STATUS.AVAILABLE];

  if (filters.brand) {
    conditions.push(`${alias}.Brand = ?`);
    params.push(filters.brand);
  }
  if (filters.model) {
    conditions.push(`${alias}.Model = ?`);
    params.push(filters.model);
  }
  for (const word of (filters.search ?? "").split(/\s+/).filter(Boolean)) {
    const pattern = `%${escapeLike(word)}%`;
    conditions.push(`(${alias}.Brand LIKE ? OR ${alias}.Model LIKE ?)`);
    params.push(pattern, pattern);
  }

  return { where: conditions.join(" AND "), params };
}
