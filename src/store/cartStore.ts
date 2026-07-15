"use client";

import { create } from "zustand";
import type { CartItem, Obat } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (obat: Obat) => void;
  removeItem: (barangId: string) => void;
  updateQuantity: (barangId: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem(obat) {
    set((state) => {
      const existing = state.items.find((item) => item.barangId === obat.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.barangId === obat.id
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
            barangId: obat.id,
            kode: obat.kode,
            nama: obat.nama,
            hargaJual: obat.hargaAktif?.hargaJual ?? 0,
            stokTersedia: obat.stokTersedia,
            membutuhkanResep: obat.membutuhkanResep,
            quantity: 1
          }
        ]
      };
    });
  },
  removeItem(barangId) {
    set((state) => ({
      items: state.items.filter((item) => item.barangId !== barangId)
    }));
  },
  updateQuantity(barangId, quantity) {
    set((state) => ({
      items: state.items.map((item) =>
        item.barangId === barangId
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
