"use client";

import { create } from "zustand";
import { stockQtyForSale } from "@/lib/eceran";
import type { CartItem, Obat } from "@/types";

interface SaleUnit {
  satuanId?: string;
  satuanNama?: string;
  tipeHarga?: CartItem["tipeHarga"];
  stockQtyPerUnit?: number;
  hargaJual?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (obat: Obat, saleUnit?: SaleUnit) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
}

function cartKeyFor(barangId: string, satuanId?: string) {
  return satuanId ? `${barangId}:${satuanId}` : barangId;
}

function itemKey(item: CartItem) {
  return item.cartKey ?? cartKeyFor(item.barangId, item.satuanId);
}

function usedStock(items: CartItem[], barangId: string, exceptKey?: string) {
  return items.reduce((sum, item) => {
    if (item.barangId !== barangId || itemKey(item) === exceptKey) {
      return sum;
    }

    return sum + stockQtyForSale(item.quantity, item.stockQtyPerUnit ?? 1);
  }, 0);
}

function maxQuantityForLine(items: CartItem[], item: CartItem) {
  const available =
    item.stokTersedia - usedStock(items, item.barangId, itemKey(item));
  return Math.floor(Math.max(0, available) / (item.stockQtyPerUnit ?? 1));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem(obat, saleUnit = {}) {
    set((state) => {
      const cartKey = cartKeyFor(obat.id, saleUnit.satuanId);
      const existing = state.items.find((item) => itemKey(item) === cartKey);
      if (existing) {
        const maxQuantity = maxQuantityForLine(state.items, existing);

        return {
          items: state.items.map((item) =>
            itemKey(item) === cartKey
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + 1,
                    Math.max(item.quantity, maxQuantity)
                  )
                }
              : item
          )
        };
      }

      const item: CartItem = {
        cartKey,
        barangId: obat.id,
        kode: obat.kode,
        nama: obat.nama,
        satuanId: saleUnit.satuanId ?? obat.satuanDefaultId,
        satuanNama: saleUnit.satuanNama ?? obat.satuanNama,
        tipeHarga: saleUnit.tipeHarga ?? "jual",
        stockQtyPerUnit: saleUnit.stockQtyPerUnit ?? 1,
        hargaJual: saleUnit.hargaJual ?? obat.hargaAktif?.hargaJual ?? 0,
        stokTersedia: obat.stokTersedia,
        membutuhkanResep: obat.membutuhkanResep,
        quantity: 1
      };
      if (maxQuantityForLine(state.items, item) <= 0) {
        return state;
      }

      return {
        items: [...state.items, item]
      };
    });
  },
  removeItem(cartKey) {
    set((state) => ({
      items: state.items.filter((item) => itemKey(item) !== cartKey)
    }));
  },
  updateQuantity(cartKey, quantity) {
    set((state) => ({
      items: state.items.map((item) =>
        itemKey(item) === cartKey
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(
                  quantity,
                  Math.max(item.quantity, maxQuantityForLine(state.items, item))
                )
              )
            }
          : item
      )
    }));
  },
  clear() {
    set({ items: [] });
  },
  subtotal() {
    return get().items.reduce(
      (sum, item) => sum + item.hargaJual * item.quantity,
      0
    );
  }
}));
