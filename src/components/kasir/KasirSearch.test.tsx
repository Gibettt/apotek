import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import { KasirSearch } from "./KasirSearch";

const mocks = vi.hoisted(() => ({
  listOptions: vi.fn(),
  list: vi.fn()
}));

vi.mock("@/services/kategoriService", () => ({
  kategoriService: {
    listOptions: mocks.listOptions
  }
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
    mocks.listOptions.mockReset();
    mocks.listOptions.mockResolvedValue([
      { id: "kat-1", label: "Analgesik" },
      { id: "kat-2", label: "Antibiotik" }
    ]);
    mocks.list.mockReset();
    mocks.list.mockResolvedValue({
      data: [supabaseMedicine],
      total: 1,
      page: 1,
      perPage: 8,
      totalPages: 1
    });
  });

  it("waits for a search query before showing medicines", async () => {
    render(<KasirSearch />);

    expect(mocks.list).not.toHaveBeenCalled();
    expect(screen.getByText("Ketik nama atau kode obat")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Filter kategori: Semua kategori" })
    );
    expect(
      await screen.findByRole("option", { name: "Analgesik" })
    ).toBeInTheDocument();
  });

  it("loads medicines from obat service after search and can add them to cart", async () => {
    render(<KasirSearch />);

    fireEvent.change(screen.getByPlaceholderText("Ketik nama atau kode obat"), {
      target: { value: "supabase" }
    });

    expect(await screen.findByText("Obat Supabase 500mg")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith({
      search: "supabase",
      perPage: 8
    });

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

    fireEvent.change(screen.getByPlaceholderText("Ketik nama atau kode obat"), {
      target: { value: "supabase" }
    });

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        search: "supabase",
        perPage: 8
      });
    });
  });

  it("filters medicines by selected category", async () => {
    render(<KasirSearch />);

    fireEvent.change(screen.getByPlaceholderText("Ketik nama atau kode obat"), {
      target: { value: "supabase" }
    });

    await screen.findByText("Obat Supabase 500mg");

    fireEvent.click(
      screen.getByRole("button", { name: "Filter kategori: Semua kategori" })
    );
    fireEvent.click(screen.getByRole("option", { name: "Analgesik" }));

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        search: "supabase",
        kategoriId: "kat-1",
        perPage: 8
      });
    });
  });
});
