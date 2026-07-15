import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null
}));

describe("DashboardPage", () => {
  it("opens the sales chart in a larger dialog and closes it with Escape", () => {
    render(<DashboardPage />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Perbesar grafik penjualan" }));

    const dialog = screen.getByRole("dialog", { name: "Grafik ringkasan penjualan" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
