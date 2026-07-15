import { notifikasi as localNotifikasi } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Notifikasi, RoleName, TipeNotifikasi } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

interface NotifikasiRow {
  id: string;
  cabang_id: string | null;
  pengguna_id: string | null;
  target_role: RoleName | null;
  tipe: TipeNotifikasi;
  judul: string;
  pesan: string | null;
  referensi_tabel: string | null;
  referensi_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

function toNotifikasi(row: NotifikasiRow): Notifikasi {
  return {
    id: row.id,
    cabangId: row.cabang_id ?? undefined,
    penggunaId: row.pengguna_id ?? undefined,
    tipe: row.tipe,
    judul: row.judul,
    pesan: row.pesan ?? undefined,
    referensiTabel: row.referensi_tabel ?? undefined,
    referensiId: row.referensi_id ?? undefined,
    isRead: row.is_read ?? false,
    targetRole: row.target_role ?? undefined,
    createdAt: row.created_at ?? ""
  };
}

function filterNotifikasi(rows: Notifikasi[], search?: string) {
  return matchSearch(rows, search, ["judul", "pesan", "tipe"]);
}

export const notifikasiService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterNotifikasi(localNotifikasi, params.search), params));
    }

    const { data, error } = await supabase
      .from("notifikasi")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterNotifikasi((data ?? []).map(toNotifikasi), params.search);
    return paginate(rows, params);
  },

  async unreadCount() {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localNotifikasi.filter((item) => !item.isRead).length);
    }

    const { count, error } = await supabase
      .from("notifikasi")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  },

  async markAsRead(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      const index = localNotifikasi.findIndex((item) => item.id === id);
      if (index >= 0) {
        localNotifikasi[index] = { ...localNotifikasi[index], isRead: true };
      }

      return delay({ id, success: true });
    }

    const { error } = await supabase.from("notifikasi").update({ is_read: true }).eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { id, success: true };
  }
};
