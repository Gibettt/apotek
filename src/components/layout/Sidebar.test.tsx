import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

let pathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname
}));

describe("Sidebar", () => {
  beforeEach(() => {
    pathname = "/dashboard";
  });

  it("renders one desktop navigation menu without duplicated links", () => {
    render(<Sidebar />);

    expect(screen.getAllByRole("link", { name: "Overview" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Penjualan" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Riwayat Transaksi" })).toHaveLength(1);
    expect(screen.getByText("Operasional")).toBeInTheDocument();
  });

  it("starts as an icon rail without a manual toggle", () => {
    render(<Sidebar />);

    const sidebar = screen.getByRole("complementary", { name: "Navigasi aplikasi" });

    expect(sidebar).toHaveClass("dashboard-sidebar-collapsed");
    expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument();
  });

  it("does not mark a child route active when the parent route is open", () => {
    pathname = "/penjualan";
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Riwayat Transaksi" })).toHaveClass("dashboard-menu-link-active");
    expect(screen.getAllByRole("link", { name: "Penjualan" })[0]).not.toHaveClass("dashboard-menu-link-active");
  });

  it("does not mark the parent route active when a child route is open", () => {
    pathname = "/penjualan/kasir";
    render(<Sidebar />);

    expect(screen.getAllByRole("link", { name: "Penjualan" })[0]).toHaveClass("dashboard-menu-link-active");
    expect(screen.getByRole("link", { name: "Riwayat Transaksi" })).not.toHaveClass("dashboard-menu-link-active");
  });
});
