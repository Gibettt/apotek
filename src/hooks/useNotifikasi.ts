"use client";

import { useNotifikasiStore } from "@/store/notifikasiStore";

export function useNotifikasi() {
  return useNotifikasiStore();
}
