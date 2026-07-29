import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "./Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard"
}));

vi.mock("@/hooks/useCabang", () => ({
  useCabang: () => ({
    activeCabangId: null,
    availableCabang: [],
    isAllBranches: false,
    setActiveCabang: vi.fn()
  })
}));

vi.mock("@/hooks/useNotifikasi", () => ({
  useNotifikasi: () => ({
    items: [],
    unreadCount: () => 0,
    loadAlerts: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn()
  })
}));

describe("Navbar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 16));
    useAuthStore.setState({
      user: {
        id: "admin",
        name: "Admin Apotek",
        email: "admin@gmail.com",
        role: "owner",
        status: true,
        cabangIds: []
      },
      token: "token",
      isLoading: false
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Admin for admin@gmail.com even if a stale session says owner", () => {
    render(<Navbar />);

    expect(screen.getByText(/Selamat sore, Admin!/)).toBeInTheDocument();
  });
});
