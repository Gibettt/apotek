"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { notifikasiService } from "@/services/notifikasiService";
import type { Notifikasi } from "@/types";

interface NotifikasiState {
  items: Notifikasi[];
  isLoaded: boolean;
  readAlertIds: string[];
  loadAlerts: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
}

// Alert stok menipis/expired dihitung ulang setiap loadAlerts() (bukan baris DB),
// jadi status "dibaca"-nya disimpan di sini lewat id-nya, bukan lewat notifikasiService.
function isGeneratedAlertId(id: string) {
  return id.startsWith("alert-stok-") || id.startsWith("alert-expired-");
}

export const useNotifikasiStore = create<NotifikasiState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoaded: false,
      readAlertIds: [],
      async loadAlerts() {
        try {
          const [alerts, result] = await Promise.all([
            notifikasiService.generateAlerts(),
            notifikasiService.list({ perPage: 9999 })
          ]);

          const readSet = new Set(get().readAlertIds);
          const mergedAlerts = alerts.map((item) =>
            readSet.has(item.id) ? { ...item, isRead: true } : item
          );

          set({ items: [...mergedAlerts, ...result.data], isLoaded: true });
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

        if (isGeneratedAlertId(id)) {
          set((state) =>
            state.readAlertIds.includes(id)
              ? state
              : { readAlertIds: [...state.readAlertIds, id] }
          );
          return;
        }

        void notifikasiService.markAsRead(id);
      },
      markAllAsRead() {
        const unread = get().items.filter((item) => !item.isRead);
        const unreadAlertIds = unread
          .filter((item) => isGeneratedAlertId(item.id))
          .map((item) => item.id);
        const unreadRealIds = unread
          .filter((item) => !isGeneratedAlertId(item.id))
          .map((item) => item.id);

        set((state) => ({
          items: state.items.map((item) => ({ ...item, isRead: true })),
          readAlertIds: [...new Set([...state.readAlertIds, ...unreadAlertIds])]
        }));

        unreadRealIds.forEach((id) => {
          void notifikasiService.markAsRead(id);
        });
      },
      unreadCount() {
        return get().items.filter((item) => !item.isRead).length;
      }
    }),
    {
      name: "apotek-notifikasi-read-state",
      partialize: (state) => ({ readAlertIds: state.readAlertIds })
    }
  )
);
