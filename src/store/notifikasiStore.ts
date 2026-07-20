"use client";

import { create } from "zustand";
import { notifikasiService } from "@/services/notifikasiService";
import type { Notifikasi } from "@/types";

interface NotifikasiState {
  items: Notifikasi[];
  isLoaded: boolean;
  loadAlerts: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
}

export const useNotifikasiStore = create<NotifikasiState>((set, get) => ({
  items: [],
  isLoaded: false,
  async loadAlerts() {
    try {
      const [alerts, result] = await Promise.all([
        notifikasiService.generateAlerts(),
        notifikasiService.list({ perPage: 9999 })
      ]);

      set({ items: [...alerts, ...result.data], isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
  markAsRead(id) {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    }));
  },
  markAllAsRead() {
    set((state) => ({
      items: state.items.map((item) => ({ ...item, isRead: true }))
    }));
  },
  unreadCount() {
    return get().items.filter((item) => !item.isRead).length;
  }
}));
