import { describe, expect, it } from "vitest";
import { buildDashboardView } from "@/lib/dashboard-view";

describe("buildDashboardView", () => {
  it("builds a seven-day overview with the weekly chart", () => {
    const view = buildDashboardView({ period: "7", category: "semua" });

    expect(view.chart).toHaveLength(7);
    expect(view.revenue).toBeGreaterThan(0);
    expect(view.transactions).toBeGreaterThan(0);
    expect(view.activeMedicines).toHaveLength(4);
  });

  it("scales summary figures when the selected period changes", () => {
    const weekly = buildDashboardView({ period: "7", category: "semua" });
    const monthly = buildDashboardView({ period: "30", category: "semua" });

    expect(monthly.revenue).toBeGreaterThan(weekly.revenue);
    expect(monthly.transactions).toBeGreaterThan(weekly.transactions);
  });

  it("limits medicines and stock metrics to the chosen category", () => {
    const view = buildDashboardView({ period: "7", category: "antibiotik" });

    expect(view.activeMedicines).toHaveLength(1);
    expect(view.activeMedicines[0]?.category).toBe("Antibiotik");
    expect(view.lowStockCount).toBe(1);
  });
});
