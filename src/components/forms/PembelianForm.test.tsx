import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PembelianForm } from "./PembelianForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  createPembelian: vi.fn(),
  listObat: vi.fn(),
  listSatuanOptions: vi.fn(),
  listKategoriOptions: vi.fn(),
  createObat: vi.fn(),
  listSupplier: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/pembelian/tambah",
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh
  })
}));

vi.mock("@/services/pembelianService", () => ({
  pembelianService: {
    create: mocks.createPembelian
  }
}));

vi.mock("@/services/obatService", () => ({
  obatService: {
    list: mocks.listObat,
    listSatuanOptions: mocks.listSatuanOptions,
    listKategoriOptions: mocks.listKategoriOptions,
    create: mocks.createObat
  }
}));

vi.mock("@/services/supplierService", () => ({
  supplierService: {
    list: mocks.listSupplier
  }
}));

describe("PembelianForm", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.createPembelian.mockReset();
    mocks.createObat.mockReset();
    mocks.listSupplier.mockResolvedValue({ data: [], total: 0 });
    mocks.listObat.mockResolvedValue({ data: [], total: 0 });
    mocks.listSatuanOptions.mockResolvedValue([]);
    mocks.listKategoriOptions.mockResolvedValue([]);
  });

  it("allows numeric inputs to be cleared while editing", async () => {
    render(<PembelianForm />);

    await waitFor(() => {
      expect(mocks.listSupplier).toHaveBeenCalled();
      expect(mocks.listObat).toHaveBeenCalled();
    });

    const transactionDiscount = screen.getByLabelText(
      "Diskon Transaksi"
    ) as HTMLInputElement;
    const tax = screen.getByLabelText("Pajak (%)") as HTMLInputElement;
    const quantity = screen.getAllByLabelText(
      "Jumlah Diterima"
    )[0] as HTMLInputElement;
    const purchasePrice = screen.getAllByLabelText(
      "Harga Beli"
    )[0] as HTMLInputElement;
    const itemDiscount = screen.getAllByLabelText(
      "Diskon Item"
    )[0] as HTMLInputElement;

    fireEvent.change(transactionDiscount, { target: { value: "" } });
    fireEvent.change(tax, { target: { value: "" } });
    fireEvent.change(quantity, { target: { value: "" } });
    fireEvent.change(purchasePrice, { target: { value: "" } });
    fireEvent.change(itemDiscount, { target: { value: "" } });

    expect(transactionDiscount.value).toBe("");
    expect(tax.value).toBe("");
    expect(quantity.value).toBe("");
    expect(purchasePrice.value).toBe("");
    expect(itemDiscount.value).toBe("");
  });

  it("auto-creates a new obat when the typed name has no master match, then submits referencing it", async () => {
    mocks.listSupplier.mockResolvedValue({
      data: [{ id: "sup-1", nama: "Supplier A", aktif: true }],
      total: 1
    });
    mocks.createObat.mockResolvedValue({ id: "obat-new-1" });
    mocks.createPembelian.mockResolvedValue({ id: "pembelian-1" });

    render(<PembelianForm />);

    await waitFor(() => {
      expect(mocks.listSupplier).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("Supplier"), {
      target: { value: "sup-1" }
    });

    const barangInputs = screen.getAllByLabelText("Barang");
    fireEvent.change(barangInputs[0], {
      target: { value: "Vitamin C Baru" }
    });

    fireEvent.click(screen.getByRole("button", { name: /simpan pembelian/i }));

    await waitFor(() => {
      expect(mocks.createObat).toHaveBeenCalledTimes(1);
    });

    expect(mocks.createObat.mock.calls[0][0]).toMatchObject({
      nama: "Vitamin C Baru"
    });

    await waitFor(() => {
      expect(mocks.createPembelian).toHaveBeenCalledTimes(1);
    });

    const submittedPayload = mocks.createPembelian.mock.calls[0][0];
    expect(submittedPayload.items).toHaveLength(1);
    expect(submittedPayload.items[0].barangId).toBe("obat-new-1");
  });

  it("computes item subtotal from a percentage discount when that mode is selected", async () => {
    render(<PembelianForm />);

    await waitFor(() => {
      expect(mocks.listSupplier).toHaveBeenCalled();
    });

    const purchasePrice = screen.getAllByLabelText(
      "Harga Beli"
    )[0] as HTMLInputElement;
    const itemDiscount = screen.getAllByLabelText(
      "Diskon Item"
    )[0] as HTMLInputElement;
    const discountMode = screen.getAllByLabelText(
      "Mode Diskon Item"
    )[0] as HTMLSelectElement;

    fireEvent.change(purchasePrice, { target: { value: "100" } });
    fireEvent.change(discountMode, { target: { value: "persen" } });
    fireEvent.change(itemDiscount, { target: { value: "10" } });

    expect(screen.getAllByText("Rp90").length).toBeGreaterThan(0);
  });

  it("auto-fills the batch number once a barang name is typed, without overwriting a manual one", async () => {
    render(<PembelianForm />);

    await waitFor(() => {
      expect(mocks.listSupplier).toHaveBeenCalled();
    });

    const barangInputs = screen.getAllByLabelText("Barang");
    const batchInputs = screen.getAllByLabelText(
      "Nomor Batch"
    ) as HTMLInputElement[];

    fireEvent.change(barangInputs[0], { target: { value: "Obat A" } });
    expect(batchInputs[0].value).toMatch(/^BATCH-\d{8}-001$/);

    fireEvent.change(batchInputs[1], { target: { value: "CUSTOM-1" } });
    fireEvent.change(barangInputs[1], { target: { value: "Obat B" } });
    expect(batchInputs[1].value).toBe("CUSTOM-1");
  });
});
