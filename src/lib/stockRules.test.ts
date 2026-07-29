import { describe, expect, it } from "vitest";
import { isLowStock } from "./stockRules";

describe("stockRules", () => {
  it("marks stock 30 and below as low stock", () => {
    expect(isLowStock(31)).toBe(false);
    expect(isLowStock(30)).toBe(true);
    expect(isLowStock(0)).toBe(true);
  });
});
