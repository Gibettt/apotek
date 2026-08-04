import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import type { Obat } from "@/types";
import { KasirPaymentModal } from "./KasirPaymentModal";

const {
  checkoutMock,
  createAccuratePaymentMock,
  pelangganListMock,
  pelangganCreateMock,
  printReceiptMock
} = vi.hoisted(() => ({
  checkoutMock: vi.fn(),
  createAccuratePaymentMock: vi.fn(),
  pelangganListMock: vi.fn(),
  pelangganCreateMock: vi.fn(),
  printReceiptMock: vi.fn()
}));

vi.mock("@/services/penjualanService", () => ({
  penjualanService: {
    checkout: checkoutMock,
    getById: vi.fn()
  }
}));

vi.mock("@/services/accuratePaymentService", () => ({
  accuratePaymentService: {
    create: createAccuratePaymentMock,
    getStatus: vi.fn()
  }
}));

vi.mock("@/services/pelangganService", () => ({
  pelangganService: {
    list: pelangganListMock,
    create: pelangganCreateMock
  }
}));

vi.mock("@/utils/printReceipt", async () => {
  const actual =
    await vi.importActual<typeof import("@/utils/printReceipt")>(
      "@/utils/printReceipt"
    );

  return {
    ...actual,
    printReceipt: printReceiptMock
  };
});

const medicine: Obat = {
  id: "12",
  kode: "OBT-PAY",
  nama: "Obat Bayar",
  stokMinimum: 10,
  stokMaksimum: 100,
  stokTersedia: 20,
  perluBatch: true,
  perluExpired: true,
  membutuhkanResep: false,
  hargaAktif: { hargaBeli: 10000, hargaJual: 30000 },
  status: true,
  createdAt: "",
  updatedAt: ""
};

describe("KasirPaymentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.getState().clear();
    useCartStore.getState().addItem(medicine);
    checkoutMock.mockResolvedValue({
      id: "sale-1",
      cabangId: "cab-1",
      nomorInvoice: "PJL-TEST",
      namaPelanggan: "Umum",
      tanggal: "",
      tipePenjualan: "umum",
      subtotal: 30000,
      diskonTotal: 0,
      pajakTotal: 0,
      grandTotal: 30000,
      bayarTotal: 30000,
      kembalian: 0,
      statusBayar: "lunas",
      status: "selesai",
      createdAt: "",
      details: []
    });
    pelangganListMock.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      perPage: 1000
    });
    pelangganCreateMock.mockResolvedValue({
      id: "pel-new",
      kode: "PLG-NEW",
      nama: "Gita",
      member: false,
      aktif: true,
      createdAt: "",
      updatedAt: ""
    });
  });

  it("allows nominal bayar input to be cleared", () => {
    render(
      <KasirPaymentModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const bayarInput = screen.getByLabelText(
      "Uang Pembayaran"
    ) as HTMLInputElement;

    expect(bayarInput.value).toBe("30000");

    fireEvent.change(bayarInput, { target: { value: "" } });

    expect(bayarInput.value).toBe("");
  });

  it("creates an Accurate e-Payment link without completing the sale", async () => {
    createAccuratePaymentMock.mockResolvedValue({
      reference: "APOTEK-123",
      status: "PENDING",
      paymentUrl: "https://checkout.example.test/APOTEK-123",
      expiresAt: "2026-07-13T10:30:00.000Z"
    });

    render(
      <KasirPaymentModal open onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "QRIS / e-Wallet" }));

    expect(screen.queryByLabelText("Uang Pembayaran")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Buat Link Pembayaran" })
    );

    await waitFor(() => {
      expect(createAccuratePaymentMock).toHaveBeenCalledWith({
        idempotencyKey: expect.any(String),
        items: [{ barangId: "12", quantity: 1 }]
      });
    });

    expect(
      await screen.findByRole("link", { name: "Buka Halaman Pembayaran" })
    ).toHaveAttribute(
      "href",
      "https://checkout.example.test/APOTEK-123"
    );
    expect(checkoutMock).not.toHaveBeenCalled();
  });

  it("sends selected pelanggan to checkout", async () => {
    render(
      <KasirPaymentModal
        open
        pelangganId="pel-123"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Selesaikan Transaksi" })
    );

    await waitFor(() => {
      expect(checkoutMock).toHaveBeenCalledWith(
        expect.objectContaining({ pelangganId: "pel-123" })
      );
    });
  });

  it("creates typed pelanggan before checkout", async () => {
    render(
      <KasirPaymentModal
        open
        pelangganNama="Gita"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Selesaikan Transaksi" })
    );

    await waitFor(() => {
      expect(pelangganCreateMock).toHaveBeenCalledWith({
        nama: "Gita",
        aktif: true
      });
      expect(checkoutMock).toHaveBeenCalledWith(
        expect.objectContaining({ pelangganId: "pel-new" })
      );
    });
  });

  it("prints the receipt after saving with print", async () => {
    render(
      <KasirPaymentModal open onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan + Cetak" }));

    await waitFor(() => {
      expect(checkoutMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(printReceiptMock).toHaveBeenCalledWith(
        expect.objectContaining({ nomorInvoice: "PJL-TEST" })
      );
    });
  });
});
