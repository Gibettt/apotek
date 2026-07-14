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
  id: 77,
  kodeObat: "OBT-SUPA",
  namaObat: "Obat Supabase 500mg",
  kategoriId: 0,
  supplierId: 0,
  satuan: "tablet",
  hargaBeli: 500,
  hargaJual: 1500,
  stokMinimum: 10,
  stokTersedia: 24,
  gambarUrl: "",
  deskripsi: "",
  golongan: "bebas" as const,
  membutuhkanResep: false,
  status: true,
  createdAt: "",
  updatedAt: "",
  kategoriNama: "Analgesik",
  supplierNama: "PT Supabase Farma"
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
      obatId: 77,
      namaObat: "Obat Supabase 500mg",
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
