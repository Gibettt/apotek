import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import { KasirSearch } from "./KasirSearch";

const mocks = vi.hoisted(() => ({
  list: vi.fn()
}));

vi.mock("@/services/obatService", () => ({
  obatService: {
    list: mocks.list
  }
}));

const supabaseMedicine = {
  id: "77",
  kode: "OBT-SUPA",
  nama: "Obat Supabase 500mg",
  satuanNama: "tablet",
  stokMinimum: 10,
  stokMaksimum: 100,
  stokTersedia: 24,
  perluBatch: true,
  perluExpired: true,
  membutuhkanResep: false,
  hargaAktif: { hargaBeli: 500, hargaJual: 1500 },
  status: true,
  createdAt: "",
  updatedAt: "",
  kategoriNama: "Analgesik",
  golonganNama: "Obat Bebas"
};

describe("KasirSearch", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    mocks.list.mockReset();
    mocks.list.mockResolvedValue({
      data: [supabaseMedicine],
      total: 1,
      page: 1,
      perPage: 8,
      totalPages: 1
    });
  });

  it("loads medicines from obat service and can add them to cart", async () => {
    render(<KasirSearch />);

    expect(await screen.findByText("Obat Supabase 500mg")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith({ search: "", perPage: 8 });

    fireEvent.click(
      screen.getByRole("button", { name: "Tambah Obat Supabase 500mg" })
    );

    expect(useCartStore.getState().items[0]).toMatchObject({
      barangId: "77",
      nama: "Obat Supabase 500mg",
      quantity: 1
    });
  });

  it("passes the search query to obat service", async () => {
    render(<KasirSearch />);

    fireEvent.change(screen.getByPlaceholderText("Cari nama atau kode obat"), {
      target: { value: "supabase" }
    });

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        search: "supabase",
        perPage: 8
      });
    });
  });
});
