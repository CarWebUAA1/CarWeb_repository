import { describe, expect, it } from "vitest";
import { buildCatalogCondition, escapeLike } from "../src/repositories/carFilters.js";

const BASE = "c.status = ? AND c.inventory_status = 'In stock' AND c.sale_price IS NOT NULL";

describe("buildCatalogCondition", () => {
  it("only lists available cars in stock with a price when there are no filters", () => {
    expect(buildCatalogCondition({})).toEqual({ where: BASE, params: ["Available"] });
  });

  it("filters by exact brand and model", () => {
    expect(buildCatalogCondition({ brand: "Toyota", model: "Corolla" })).toEqual({
      where: `${BASE} AND c.brand = ? AND c.model = ?`,
      params: ["Available", "Toyota", "Corolla"],
    });
  });

  it("requires every search word to appear in the brand or the model", () => {
    expect(buildCatalogCondition({ search: "toyota  corolla" })).toEqual({
      where: `${BASE} AND (c.brand LIKE ? OR c.model LIKE ?) AND (c.brand LIKE ? OR c.model LIKE ?)`,
      params: ["Available", "%toyota%", "%toyota%", "%corolla%", "%corolla%"],
    });
  });

  it("takes LIKE wildcards in the search literally", () => {
    const { params } = buildCatalogCondition({ search: "50%_off" });
    expect(params).toEqual(["Available", "%50\\%\\_off%", "%50\\%\\_off%"]);
  });
});

describe("escapeLike", () => {
  it("escapes %, _ and backslash", () => {
    expect(escapeLike("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });
});
