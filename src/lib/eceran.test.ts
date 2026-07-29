import { describe, expect, it } from "vitest";
import { formatMixedStock, stockQtyForSale } from "./eceran";

describe("eceran helpers", () => {
  it("formats fractional main stock as mixed stock", () => {
    expect(formatMixedStock(2.5, 10, "strip", "tablet")).toBe(
      "2 strip 5 tablet"
    );
  });

  it("converts eceran quantity into stock quantity", () => {
    expect(stockQtyForSale(5, 0.1)).toBe(0.5);
  });
});
