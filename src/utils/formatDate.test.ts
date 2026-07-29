import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, localDateKey } from "./formatDate";

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

  it("builds a local date key for dashboard counters", () => {
    expect(localDateKey("2026-07-28T14:48:00")).toBe("2026-07-28");
    expect(localDateKey("bukan tanggal")).toBe("");
  });
});
