"use client";

import { create } from "zustand";
import type { CartItem, Obat } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (obat: Obat) => void;
  removeItem: (obatId: number) => void;
  updateQuantity: (obatId: number, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem(obat) {
    set((state) => {
      const existing = state.items.find((item) => item.obatId === obat.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.obatId === obat.id
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + 1, item.stokTersedia)
                }
              : item
          )
        };
      }

      return {
        items: [
          ...state.items,
          {
            obatId: obat.id,
            kodeObat: obat.kodeObat,
            namaObat: obat.namaObat,
            hargaJual: obat.hargaJual,
            stokTersedia: obat.stokTersedia,
            membutuhkanResep: obat.membutuhkanResep,
            quantity: 1
          }
        ]
      };
    });
  },
  removeItem(obatId) {
    set((state) => ({
      items: state.items.filter((item) => item.obatId !== obatId)
    }));
  },
  updateQuantity(obatId, quantity) {
    set((state) => ({
      items: state.items.map((item) =>
        item.obatId === obatId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.stokTersedia))
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
