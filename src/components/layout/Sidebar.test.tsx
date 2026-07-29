import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "./Sidebar";

let pathname = "/dashboard";
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace })
}));

describe("Sidebar", () => {
  beforeEach(() => {
    pathname = "/dashboard";
    replace.mockClear();
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isLoading: false });
    vi.restoreAllMocks();
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

  it("stays on the dashboard when logout is canceled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));

    expect(replace).not.toHaveBeenCalled();
  });

  it("logs out and redirects to login when confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    localStorage.setItem("apotek-token", "token");
    useAuthStore.setState({
      user: {
        id: "admin",
        name: "Admin Apotek",
        email: "admin@gmail.com",
        role: "admin",
        status: true,
        cabangIds: []
      },
      token: "token",
      isLoading: false
    });

    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(localStorage.getItem("apotek-token")).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
