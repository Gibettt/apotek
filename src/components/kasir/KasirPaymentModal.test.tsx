import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import type { Obat } from "@/types";
import { KasirPaymentModal } from "./KasirPaymentModal";

const { checkoutMock, createAccuratePaymentMock } = vi.hoisted(() => ({
  checkoutMock: vi.fn(),
  createAccuratePaymentMock: vi.fn()
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

const medicine: Obat = {
  id: 12,
  kodeObat: "OBT-PAY",
  namaObat: "Obat Bayar",
  kategoriId: 0,
  supplierId: 0,
  satuan: "tablet",
  hargaBeli: 10000,
  hargaJual: 30000,
  stokMinimum: 10,
  stokTersedia: 20,
  gambarUrl: "",
  deskripsi: "",
  golongan: "bebas",
  membutuhkanResep: false,
  status: true,
  createdAt: "",
  updatedAt: ""
};

describe("KasirPaymentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.getState().clear();
    useCartStore.getState().addItem(medicine);
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
      "Nominal Bayar"
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

    fireEvent.change(screen.getByLabelText("Metode Pembayaran"), {
      target: { value: "accurate" }
    });

    expect(screen.queryByLabelText("Nominal Bayar")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Buat Link Pembayaran" })
    );

    await waitFor(() => {
      expect(createAccuratePaymentMock).toHaveBeenCalledWith({
        idempotencyKey: expect.any(String),
        items: [{ obatId: 12, quantity: 1 }]
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
});
