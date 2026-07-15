import { obat as localObat, stokBatches as localStokBatches, stokMutasi as localStokMutasi } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { StokBatch, StokMutasi, TipeMutasi } from "@/types";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface LowStockItem {
  id: string;
  nama: string;
  stokMinimum: number;
  stokTersedia: number;
}

export interface ExpiringBatch {
  id: string;
  barangId: string;
  namaBarang: string;
  nomorBatch: string;
  tanggalExpired: string;
  qty: number;
}

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

interface SaldoStokRow {
  id: string;
  cabang_id: string;
  barang_id: string;
  batch_id: string | null;
  lokasi_simpan_id: string | null;
  qty: number | string | null;
  updated_at: string | null;
  barang?: { nama: string } | { nama: string }[] | null;
  batch_barang?:
    | { nomor_batch: string; tanggal_expired: string | null }
    | { nomor_batch: string; tanggal_expired: string | null }[]
    | null;
  lokasi_simpan?: { nama: string } | { nama: string }[] | null;
}

interface KartuStokRow {
  id: string;
  cabang_id: string;
  barang_id: string;
  batch_id: string | null;
  tipe_mutasi: TipeMutasi;
  qty_masuk: number | string | null;
  qty_keluar: number | string | null;
  saldo_akhir: number | string | null;
  harga_pokok: number | string | null;
  sumber_tabel: string | null;
  sumber_id: string | null;
  keterangan: string | null;
  dibuat_oleh: string | null;
  created_at: string | null;
  barang?: { nama: string } | { nama: string }[] | null;
}

function toStokBatch(row: SaldoStokRow): StokBatch {
  const barang = firstOf(row.barang);
  const batch = firstOf(row.batch_barang);
  const lokasi = firstOf(row.lokasi_simpan);

  return {
    id: row.id,
    barangId: row.barang_id,
    namaBarang: barang?.nama ?? "-",
    nomorBatch: batch?.nomor_batch ?? "-",
    tanggalExpired: batch?.tanggal_expired ?? undefined,
    qty: Number(row.qty ?? 0),
    cabangId: row.cabang_id,
    lokasiSimpanId: row.lokasi_simpan_id ?? undefined,
    lokasiNama: lokasi?.nama,
    createdAt: row.updated_at ?? "",
    updatedAt: row.updated_at ?? ""
  };
}

function toStokMutasi(row: KartuStokRow): StokMutasi {
  const barang = firstOf(row.barang);

  return {
    id: row.id,
    cabangId: row.cabang_id,
    barangId: row.barang_id,
    namaBarang: barang?.nama ?? "-",
    batchId: row.batch_id ?? undefined,
    tipeMutasi: row.tipe_mutasi,
    qtyMasuk: Number(row.qty_masuk ?? 0),
    qtyKeluar: Number(row.qty_keluar ?? 0),
    saldoAkhir: Number(row.saldo_akhir ?? 0),
    hargaPokok: Number(row.harga_pokok ?? 0),
    sumberTabel: row.sumber_tabel ?? undefined,
    sumberId: row.sumber_id ?? undefined,
    keterangan: row.keterangan ?? undefined,
    createdBy: row.dibuat_oleh ?? undefined,
    createdAt: row.created_at ?? ""
  };
}

function filterStokBatch(rows: StokBatch[], search?: string) {
  return matchSearch(rows, search, ["namaBarang", "nomorBatch", "lokasiNama"]);
}

function filterStokMutasi(rows: StokMutasi[], search?: string) {
  return matchSearch(rows, search, ["namaBarang", "keterangan"]);
}

export const stokService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterStokBatch(localStokBatches, params.search), params));
    }

    const { data, error } = await supabase
      .from("saldo_stok")
      .select(
        "id,cabang_id,barang_id,batch_id,lokasi_simpan_id,qty,updated_at,barang(nama),batch_barang(nomor_batch,tanggal_expired),lokasi_simpan(nama)"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterStokBatch((data ?? []).map(toStokBatch), params.search);
    return paginate(rows, params);
  },

  async lowStock(): Promise<LowStockItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(
        localObat
          .filter((item) => item.stokTersedia < item.stokMinimum)
          .map((item) => ({
            id: item.id,
            nama: item.nama,
            stokMinimum: item.stokMinimum,
            stokTersedia: item.stokTersedia
          }))
      );
    }

    const [barangResult, saldoResult] = await Promise.all([
      supabase.from("barang").select("id,nama,stok_minimum").eq("aktif", true),
      supabase.from("saldo_stok").select("barang_id,qty")
    ]);

    if (barangResult.error) {
      throw new Error(barangResult.error.message);
    }

    if (saldoResult.error) {
      throw new Error(saldoResult.error.message);
    }

    const qtyByBarang = (saldoResult.data ?? []).reduce<Record<string, number>>((acc, row) => {
      if (!row.barang_id) {
        return acc;
      }

      acc[row.barang_id] = (acc[row.barang_id] ?? 0) + Number(row.qty ?? 0);
      return acc;
    }, {});

    return (barangResult.data ?? [])
      .map((item) => ({
        id: item.id as string,
        nama: item.nama as string,
        stokMinimum: Number(item.stok_minimum ?? 0),
        stokTersedia: qtyByBarang[item.id] ?? 0
      }))
      .filter((item) => item.stokTersedia < item.stokMinimum);
  },

  async expiredSoon(days = 60): Promise<ExpiringBatch[]> {
    if (!isSupabaseConfigured || !supabase) {
      const limit = new Date();
      limit.setDate(limit.getDate() + days);

      return delay(
        localStokBatches
          .filter((item) => item.tanggalExpired && new Date(item.tanggalExpired) <= limit)
          .map((item) => ({
            id: item.id,
            barangId: item.barangId,
            namaBarang: item.namaBarang,
            nomorBatch: item.nomorBatch,
            tanggalExpired: item.tanggalExpired ?? "",
            qty: item.qty
          }))
      );
    }

    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const limitDate = limit.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("batch_barang")
      .select("id,barang_id,nomor_batch,tanggal_expired,barang(nama),saldo_stok(qty)")
      .not("tanggal_expired", "is", null)
      .lte("tanggal_expired", limitDate)
      .order("tanggal_expired", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => {
      const barang = firstOf(row.barang as { nama: string } | { nama: string }[] | null);
      const saldoRows = Array.isArray(row.saldo_stok)
        ? (row.saldo_stok as { qty: number | string | null }[])
        : row.saldo_stok
          ? [row.saldo_stok as { qty: number | string | null }]
          : [];
      const qty = saldoRows.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);

      return {
        id: row.id as string,
        barangId: row.barang_id as string,
        namaBarang: barang?.nama ?? "-",
        nomorBatch: row.nomor_batch as string,
        tanggalExpired: (row.tanggal_expired as string) ?? "",
        qty
      };
    });
  },

  async mutations(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterStokMutasi(localStokMutasi, params.search), params));
    }

    const { data, error } = await supabase
      .from("kartu_stok")
      .select("*,barang(nama)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterStokMutasi((data ?? []).map(toStokMutasi), params.search);
    return paginate(rows, params);
  }
};
