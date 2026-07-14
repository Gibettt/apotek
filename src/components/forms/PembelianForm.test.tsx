import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PembelianForm } from "./PembelianForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  createPembelian: vi.fn(),
  listObat: vi.fn(),
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
    list: mocks.listObat
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
    mocks.listSupplier.mockResolvedValue({ data: [], total: 0 });
    mocks.listObat.mockResolvedValue({ data: [], total: 0 });
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
    const tax = screen.getByLabelText("Pajak") as HTMLInputElement;
    const quantity = screen.getByLabelText("Jumlah") as HTMLInputElement;
    const purchasePrice = screen.getByLabelText(
      "Harga Beli"
    ) as HTMLInputElement;
    const itemDiscount = screen.getByLabelText("Diskon") as HTMLInputElement;

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
});
