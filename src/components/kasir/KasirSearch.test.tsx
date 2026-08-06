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
      perPage: 12,
      totalPages: 1
    });
  });

  it("loads initial medicines before search", async () => {
    render(<KasirSearch />);

    expect(await screen.findByText("Obat Supabase 500mg")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith({ page: 1, perPage: 12 });

    expect(
      await screen.findByRole("button", { name: "Analgesik" })
    ).toBeInTheDocument();
  });

  it("reports the total medicines count to the cashier dashboard", async () => {
    const onTotalChange = vi.fn();

    render(<KasirSearch onTotalChange={onTotalChange} />);

    await screen.findByText("Obat Supabase 500mg");

    expect(onTotalChange).toHaveBeenCalledWith(1);
  });

  it("loads medicines from obat service after search and can add them to cart", async () => {
    render(<KasirSearch />);

    fireEvent.change(screen.getByPlaceholderText("Ketik nama atau kode obat"), {
      target: { value: "supabase" }
    });

    expect(await screen.findByText("Obat Supabase 500mg")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith({
      search: "supabase",
      page: 1,
      perPage: 12
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

  it("allows prescription medicines to be sold from cashier", async () => {
    mocks.list.mockResolvedValue({
      data: [{ ...supabaseMedicine, membutuhkanResep: true, golonganNama: "Obat Keras" }],
      total: 1,
      page: 1,
      perPage: 12,
      totalPages: 1
    });

    render(<KasirSearch />);

    expect(await screen.findByText("Resep")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Tambah Obat Supabase 500mg" })
    );

    expect(useCartStore.getState().items[0]).toMatchObject({
      barangId: "77",
      membutuhkanResep: true,
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
        page: 1,
        perPage: 12
      });
    });
  });

  it("filters medicines by selected category", async () => {
    render(<KasirSearch />);

    fireEvent.change(screen.getByPlaceholderText("Ketik nama atau kode obat"), {
      target: { value: "supabase" }
    });

    await screen.findByText("Obat Supabase 500mg");

    fireEvent.click(screen.getByRole("button", { name: "Analgesik" }));

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        search: "supabase",
        kategoriId: "kat-1",
        page: 1,
        perPage: 12
      });
    });
  });

  it("loads the next page when more than 12 medicines exist", async () => {
    mocks.list.mockResolvedValue({
      data: [supabaseMedicine],
      total: 13,
      page: 1,
      perPage: 12
    });

    render(<KasirSearch />);

    expect(await screen.findByText("Obat Supabase 500mg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({ page: 2, perPage: 12 });
    });
  });
});
