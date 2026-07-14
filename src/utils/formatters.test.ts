import { describe, expect, it } from "vitest";
import { formatCurrency } from "./formatCurrency";
import { formatPhone } from "./formatPhone";

describe("formatters", () => {
  it("formats IDR without decimal digits", () => {
    expect(formatCurrency(125000)).toBe("Rp125.000");
  });

  it("normalizes Indonesian phone numbers", () => {
    expect(formatPhone("0812-3456-7890")).toBe("+6281234567890");
    expect(formatPhone("6281234567890")).toBe("+6281234567890");
  });
});
