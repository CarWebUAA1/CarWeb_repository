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
 * Builds the WHERE clause of the public catalog: only available cars in stock that have
 * a sale price (sale_price is nullable in the schema), plus the optional filters.
 *
 * Case and accents are ignored by the column collation (utf8mb4_0900_ai_ci, see sql/schema.sql),
 * so "MÁZDA" matches "Mazda".
 */
export function buildCatalogCondition(filters: CarFilters, alias = "c"): SqlCondition {
  const conditions = [
    `${alias}.status = ?`,
    `${alias}.inventory_status = 'In stock'`,
    `${alias}.sale_price IS NOT NULL`,
  ];
  const params: unknown[] = [CAR_STATUS.AVAILABLE];

  if (filters.brand) {
    conditions.push(`${alias}.brand = ?`);
    params.push(filters.brand);
  }
  if (filters.model) {
    conditions.push(`${alias}.model = ?`);
    params.push(filters.model);
  }
  for (const word of (filters.search ?? "").split(/\s+/).filter(Boolean)) {
    const pattern = `%${escapeLike(word)}%`;
    conditions.push(`(${alias}.brand LIKE ? OR ${alias}.model LIKE ?)`);
    params.push(pattern, pattern);
  }

  return { where: conditions.join(" AND "), params };
}
