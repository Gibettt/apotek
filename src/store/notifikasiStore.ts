"use client";

import { create } from "zustand";
import { notifikasi } from "@/lib/mock-data";
import type { Notifikasi } from "@/types";

interface NotifikasiState {
  items: Notifikasi[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
}

export const useNotifikasiStore = create<NotifikasiState>((set, get) => ({
  items: notifikasi,
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
