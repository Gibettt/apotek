"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cabang } from "@/types";
import { cabangService } from "@/services/cabangService";

interface CabangState {
  activeCabangId: string | null;
  availableCabang: Cabang[];
  isAllBranches: boolean;
  setActiveCabang: (id: string | null) => void;
  loadForPengguna: (penggunaId: string, options?: { allowAllBranches?: boolean }) => Promise<void>;
}

export const useCabangStore = create<CabangState>()(
  persist(
    (set, get) => ({
      activeCabangId: null,
      availableCabang: [],
      isAllBranches: false,
      setActiveCabang(id) {
        set({ activeCabangId: id, isAllBranches: id === null });
      },
      async loadForPengguna(penggunaId, options) {
        const cabang = await cabangService.listForPengguna(penggunaId);
        const current = get().activeCabangId;
        const stillValid = current ? cabang.some((item) => item.id === current) : false;
        const fallback = cabang[0]?.id ?? null;

        set({
          availableCabang: cabang,
          activeCabangId: stillValid ? current : options?.allowAllBranches ? null : fallback,
          isAllBranches: stillValid ? get().isAllBranches : !options?.allowAllBranches ? false : get().isAllBranches
        });
      }
    }),
    {
      name: "apotek-active-cabang",
      partialize: (state) => ({
        activeCabangId: state.activeCabangId,
        isAllBranches: state.isAllBranches
      })
    }
  )
);
