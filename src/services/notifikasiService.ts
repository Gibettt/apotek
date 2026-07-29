import { notifikasi as localNotifikasi } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Notifikasi, RoleName, TipeNotifikasi } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";
import { stokService } from "./stokService";

// Batas peringatan expired: 3 bulan (~90 hari) sebelum tanggal kadaluarsa.
const EXPIRY_ALERT_DAYS = 90;

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
  // Bikin notifikasi otomatis dari kondisi stok:
  // - stok menipis (stok tersedia <= 30)
  // - obat akan expired dalam 3 bulan (atau sudah expired)
  async generateAlerts(): Promise<Notifikasi[]> {
    const [lowStock, expiring] = await Promise.all([
      stokService.lowStock(),
      stokService.expiredSoon(EXPIRY_ALERT_DAYS)
    ]);

    const createdAt = new Date().toISOString();

    const lowStockAlerts: Notifikasi[] = lowStock.map((item) => ({
      id: `alert-stok-${item.id}`,
      tipe: "stok_menipis",
      judul: `Stok menipis: ${item.nama}`,
      pesan: `Sisa stok ${item.stokTersedia}, batas menipis ${item.stokMinimum}. Segera lakukan restock.`,
      referensiTabel: "barang",
      referensiId: item.id,
      isRead: false,
      createdAt
    }));

    const expiredAlerts: Notifikasi[] = expiring.map((batch) => ({
      id: `alert-expired-${batch.id}`,
      tipe: "obat_expired",
      judul: `Akan kadaluarsa: ${batch.namaBarang}`,
      pesan: `Batch ${batch.nomorBatch} kadaluarsa ${batch.tanggalExpired} (sisa ${batch.qty}).`,
      referensiTabel: "batch_barang",
      referensiId: batch.id,
      isRead: false,
      createdAt
    }));

    return [...lowStockAlerts, ...expiredAlerts];
  },

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
