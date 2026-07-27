import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./formatDate";

describe("formatDate", () => {
  it("formats a valid date string", () => {
    expect(formatDate("2026-07-07")).toBe("07 Jul 2026");
  });

  it("falls back to a dash instead of throwing on empty/invalid input", () => {
    expect(formatDate("")).toBe("-");
    expect(formatDate("bukan tanggal")).toBe("-");
  });

  it("formatDateTime also falls back on invalid input", () => {
    expect(formatDateTime("")).toBe("-");
  });
});
