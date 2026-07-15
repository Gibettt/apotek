import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard"
}));

describe("Sidebar", () => {
  it("renders one desktop navigation menu without duplicated links", () => {
    render(<Sidebar />);

    expect(screen.getAllByRole("link", { name: "Overview" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Kasir" })).toHaveLength(1);
    expect(screen.getByText("Operasional")).toBeInTheDocument();
  });

  it("collapses into an icon rail and can be expanded again", () => {
    render(<Sidebar />);

    const sidebar = screen.getByRole("complementary", { name: "Navigasi aplikasi" });
    const toggle = screen.getByRole("button", { name: "Tutup sidebar" });

    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);

    expect(sidebar).toHaveClass("dashboard-sidebar-collapsed");
    expect(screen.getByRole("button", { name: "Buka sidebar" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "Buka sidebar" }));

    expect(sidebar).not.toHaveClass("dashboard-sidebar-collapsed");
  });
});
