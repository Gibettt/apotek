import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObatListPage } from "./ObatListPage";

const mocks = vi.hoisted(() => ({
  listOptions: vi.fn(),
  list: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  masuk: vi.fn()
}));

vi.mock("@/components/layout/Header", () => ({
  Header: ({ title }: { title: string }) => <h1>{title}</h1>
}));

vi.mock("@/services/kategoriService", () => ({
  kategoriService: {
    listOptions: mocks.listOptions
  }
}));

vi.mock("@/services/obatService", async () => {
  const actual = await vi.importActual<typeof import("@/services/obatService")>(
    "@/services/obatService"
  );

  return {
    ...actual,
    obatService: {
      list: mocks.list,
      delete: mocks.delete,
      update: mocks.update
    }
  };
});

vi.mock("@/services/stokService", () => ({
  stokService: {
    masuk: mocks.masuk
  }
}));

const medicine = {
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

describe("ObatListPage", () => {
  beforeEach(() => {
    mocks.listOptions.mockReset();
    mocks.listOptions.mockResolvedValue([
      { id: "kat-1", label: "Analgesik" },
      { id: "kat-2", label: "Antibiotik" }
    ]);
    mocks.list.mockReset();
    mocks.list.mockResolvedValue({
      data: [medicine],
      total: 1,
      page: 1,
      perPage: 8
    });
  });

  it("filters stock items by selected category", async () => {
    render(<ObatListPage />);

    await screen.findByText("Obat Supabase 500mg");

    fireEvent.click(
      screen.getByRole("button", { name: "Filter kategori: Semua kategori" })
    );
    fireEvent.click(screen.getByRole("option", { name: "Analgesik" }));

    await waitFor(() => {
      expect(mocks.list).toHaveBeenLastCalledWith({
        search: "",
        kategoriId: "kat-1",
        page: 1,
        perPage: 8
      });
    });
  });
});
