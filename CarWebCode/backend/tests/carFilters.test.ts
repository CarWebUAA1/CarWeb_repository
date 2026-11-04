import { describe, expect, it } from "vitest";
import { buildCatalogCondition, escapeLike } from "../src/repositories/carFilters.js";

const BASE = "c.StatusOfCar = ? AND c.InventoryStatus = TRUE";

describe("buildCatalogCondition", () => {
  it("only lists available cars when there are no filters", () => {
    expect(buildCatalogCondition({})).toEqual({ where: BASE, params: ["Available"] });
  });

  it("filters by exact brand and model", () => {
    expect(buildCatalogCondition({ brand: "Toyota", model: "Corolla" })).toEqual({
      where: `${BASE} AND c.Brand = ? AND c.Model = ?`,
      params: ["Available", "Toyota", "Corolla"],
    });
  });

  it("requires every search word to appear in the brand or the model", () => {
    expect(buildCatalogCondition({ search: "toyota  corolla" })).toEqual({
      where: `${BASE} AND (c.Brand LIKE ? OR c.Model LIKE ?) AND (c.Brand LIKE ? OR c.Model LIKE ?)`,
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
