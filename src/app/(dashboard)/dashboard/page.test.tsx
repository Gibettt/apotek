import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

vi.mock("recharts", () => ({
  Area: (props: { dataKey: string; name: string; type?: string }) => (
    <path data-testid={`area-${props.dataKey}`} data-name={props.name} data-type={props.type} />
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null
}));

describe("DashboardPage", () => {
  it("renders sales as a smooth two-series area chart", async () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Grafik penjualan" })).toBeInTheDocument();
    expect(screen.getByLabelText("Dari tanggal grafik")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Sampai tanggal grafik")).toHaveAttribute("type", "date");
    expect(screen.getByTestId("area-revenue")).toHaveAttribute("data-name", "Pendapatan");
    expect(screen.getByTestId("area-revenue")).toHaveAttribute("data-type", "monotone");
    expect(screen.getByTestId("area-profit")).toHaveAttribute("data-name", "Laba");
    expect(screen.getByTestId("area-profit")).toHaveAttribute("data-type", "monotone");
    expect(screen.getByRole("button", { name: "Halaman obat sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman obat berikutnya" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pilih kategori" }));
    expect(screen.getByRole("listbox", { name: "Pilih kategori" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Analgesik" }));
    expect(screen.queryByRole("listbox", { name: "Pilih kategori" })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Buka antrian resep" })).toBeInTheDocument()
    );
  });
});
