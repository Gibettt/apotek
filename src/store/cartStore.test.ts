import { beforeEach, describe, expect, it } from "vitest";
import type { Obat } from "@/types";
import { useCartStore } from "./cartStore";

const medicines: Obat[] = [
  {
    id: 1,
    kodeObat: "OBT-TEST-1",
    namaObat: "Obat Test 1",
    kategoriId: 0,
    supplierId: 0,
    satuan: "tablet",
    hargaBeli: 500,
    hargaJual: 1000,
    stokMinimum: 10,
    stokTersedia: 12,
    gambarUrl: "",
    deskripsi: "",
    golongan: "bebas",
    membutuhkanResep: false,
    status: true,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: 2,
    kodeObat: "OBT-TEST-2",
    namaObat: "Obat Test 2",
    kategoriId: 0,
    supplierId: 0,
    satuan: "kapsul",
    hargaBeli: 700,
    hargaJual: 1600,
    stokMinimum: 10,
    stokTersedia: 3,
    gambarUrl: "",
    deskripsi: "",
    golongan: "bebas",
    membutuhkanResep: false,
    status: true,
    createdAt: "",
    updatedAt: ""
  }
];

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("adds items and calculates subtotal", () => {
    useCartStore.getState().addItem(medicines[0]);
    useCartStore.getState().addItem(medicines[0]);
    useCartStore.getState().updateQuantity(medicines[0].id, 3);

    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().subtotal()).toBe(
      medicines[0].hargaJual * 3
    );
  });

  it("caps quantity to available stock", () => {
    useCartStore.getState().addItem(medicines[1]);
    useCartStore.getState().updateQuantity(medicines[1].id, 1000);

    expect(useCartStore.getState().items[0].quantity).toBe(
      medicines[1].stokTersedia
    );
  });

  it("removes and clears items", () => {
    useCartStore.getState().addItem(medicines[0]);
    useCartStore.getState().addItem(medicines[1]);
    useCartStore.getState().removeItem(medicines[0].id);

    expect(useCartStore.getState().items).toHaveLength(1);

    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
