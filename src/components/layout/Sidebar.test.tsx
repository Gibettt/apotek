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
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: {
        id: "owner",
        name: "Owner Apotek",
        email: "owner@gmail.com",
        role: "owner",
        status: true,
        cabangIds: []
      },
      token: "token",
      isLoading: false
    });
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

  it("locks owner-only finance, report, and management links for non-owner email", () => {
    useAuthStore.setState({
      user: {
        id: "kasir",
        name: "Kasir Apotek",
        email: "kasir@gmail.com",
        role: "kasir",
        status: true,
        cabangIds: []
      },
      token: "token",
      isLoading: false
    });

    render(<Sidebar />);

    expect(screen.getByRole("button", { name: "Penjualan terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pembelian terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Surat Pesanan terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retur Pembelian terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Akun (CoA) terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jurnal Umum terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Biaya Operasional terkunci" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Stok terkunci" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Users terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Role terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Permission terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audit Log terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profil apotek terkunci" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bantuan terkunci" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Penjualan" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Pembelian" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Surat Pesanan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Retur Pembelian" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Stok" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("locks owner-only links when role is owner but email is not owner@gmail.com", () => {
    useAuthStore.setState({
      user: {
        id: "owner-2",
        name: "Owner Lain",
        email: "owner@apotek.local",
        role: "owner",
        status: true,
        cabangIds: []
      },
      token: "token",
      isLoading: false
    });

    render(<Sidebar />);

    expect(screen.getByRole("button", { name: "Users terkunci" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("stays on the dashboard when logout is canceled", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(replace).not.toHaveBeenCalled();
  });

  it("logs out and redirects to login when confirmed", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Ya, logout" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(localStorage.getItem("apotek-token")).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
