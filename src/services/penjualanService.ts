import { penjualan as initialPenjualan } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  CartItem,
  MetodePembayaran,
  Penjualan,
  PenjualanDetail,
  StatusPenjualan
} from "@/types";
import { matchSearch, paginate, type ListParams } from "./serviceUtils";

interface PenjualanRow {
  id: number;
  nomor_penjualan: string;
  pelanggan_id: number | null;
  resep_id: number | null;
  tanggal_penjualan: string | null;
  subtotal: number | string | null;
  diskon: number | string | null;
  pajak: number | string | null;
  total: number | string | null;
  metode_pembayaran: MetodePembayaran | null;
  bayar: number | string | null;
  kembalian: number | string | null;
  status: StatusPenjualan | null;
  catatan: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface PenjualanDetailRow {
  id: number;
  penjualan_id: number | null;
  obat_id: number | null;
  jumlah: number | null;
  harga_jual: number | string | null;
  diskon: number | string | null;
  subtotal: number | string | null;
}

interface CheckoutPayload {
  items: CartItem[];
  metodePembayaran: MetodePembayaran;
  bayar: number;
  pelangganId?: number;
  resepId?: number;
}

const localPenjualan: Penjualan[] = [...initialPenjualan];

function generateNomorPenjualan(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `PJL-${stamp}-${suffix}`;
}

function filterPenjualan(rows: Penjualan[], search?: string) {
  return matchSearch(rows, search, [
    "nomorPenjualan",
    "namaPelanggan",
    "metodePembayaran",
    "status"
  ]);
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      pelangganById: {} as Record<number, string>,
      obatById: {} as Record<number, string>
    };
  }

  const [pelangganResult, obatResult] = await Promise.all([
    supabase.from("pelanggan").select("id,nama"),
    supabase.from("obat").select("id,nama_obat")
  ]);

  if (pelangganResult.error) {
    throw new Error(pelangganResult.error.message);
  }

  if (obatResult.error) {
    throw new Error(obatResult.error.message);
  }

  return {
    pelangganById: Object.fromEntries(
      (pelangganResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    obatById: Object.fromEntries(
      (obatResult.data ?? []).map((item) => [item.id, item.nama_obat])
    )
  };
}

function toDetail(
  row: PenjualanDetailRow,
  obatById: Record<number, string> = {}
): PenjualanDetail {
  const obatId = row.obat_id ?? 0;

  return {
    id: row.id,
    penjualanId: row.penjualan_id ?? 0,
    obatId,
    namaObat: obatById[obatId] ?? "-",
    jumlah: row.jumlah ?? 0,
    hargaJual: Number(row.harga_jual ?? 0),
    diskon: Number(row.diskon ?? 0),
    subtotal: Number(row.subtotal ?? 0)
  };
}

function toPenjualan(
  row: PenjualanRow,
  details: PenjualanDetail[] = [],
  pelangganById: Record<number, string> = {}
): Penjualan {
  const pelangganId = row.pelanggan_id ?? undefined;

  return {
    id: row.id,
    nomorPenjualan: row.nomor_penjualan,
    pelangganId,
    namaPelanggan: pelangganId ? pelangganById[pelangganId] ?? "Pelanggan" : "Umum",
    resepId: row.resep_id ?? undefined,
    tanggalPenjualan: row.tanggal_penjualan ?? row.created_at ?? "",
    subtotal: Number(row.subtotal ?? 0),
    diskon: Number(row.diskon ?? 0),
    pajak: Number(row.pajak ?? 0),
    total: Number(row.total ?? 0),
    metodePembayaran: row.metode_pembayaran ?? "tunai",
    bayar: Number(row.bayar ?? 0),
    kembalian: Number(row.kembalian ?? 0),
    status: row.status ?? "selesai",
    catatan: row.catatan ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at ?? "",
    details
  };
}

async function loadDetailsForSales(ids: number[]) {
  if (!supabase || !ids.length) {
    return {} as Record<number, PenjualanDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase.from("penjualan_detail").select("*").in("penjualan_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PenjualanDetailRow[]).reduce<
    Record<number, PenjualanDetail[]>
  >((acc, row) => {
    const detail = toDetail(row, lookupMaps.obatById);
    acc[detail.penjualanId] = [...(acc[detail.penjualanId] ?? []), detail];
    return acc;
  }, {});
}

function localCheckout(payload: CheckoutPayload): Penjualan {
  const subtotal = payload.items.reduce(
    (sum, item) => sum + item.hargaJual * item.quantity,
    0
  );
  const now = new Date().toISOString();
  const id = Date.now();
  const created: Penjualan = {
    id,
    nomorPenjualan: generateNomorPenjualan(new Date(now)),
    pelangganId: payload.pelangganId,
    namaPelanggan: payload.pelangganId ? "Pelanggan terdaftar" : "Umum",
    resepId: payload.resepId,
    tanggalPenjualan: now,
    subtotal,
    diskon: 0,
    pajak: 0,
    total: subtotal,
    metodePembayaran: payload.metodePembayaran,
    bayar: payload.bayar,
    kembalian: payload.bayar - subtotal,
    status: "selesai",
    createdBy: "local-user",
    createdAt: now,
    details: payload.items.map((item, index) => ({
      id: index + 1,
      penjualanId: id,
      obatId: item.obatId,
      namaObat: item.namaObat,
      jumlah: item.quantity,
      hargaJual: item.hargaJual,
      diskon: 0,
      subtotal: item.hargaJual * item.quantity
    }))
  };

  localPenjualan.unshift(created);
  return created;
}

export const penjualanService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterPenjualan(localPenjualan, params.search), params);
    }

    const [{ data, error }, lookupMaps] = await Promise.all([
      supabase
        .from("penjualan")
        .select("*")
        .order("tanggal_penjualan", { ascending: false }),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    const detailBySale = await loadDetailsForSales(
      ((data ?? []) as PenjualanRow[]).map((item) => item.id)
    );
    const rows = filterPenjualan(
      ((data ?? []) as PenjualanRow[]).map((item) =>
        toPenjualan(item, detailBySale[item.id] ?? [], lookupMaps.pelangganById)
      ),
      params.search
    );

    return paginate(rows, params);
  },

  async getById(id: number) {
    if (!isSupabaseConfigured || !supabase) {
      return localPenjualan.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, lookupMaps, detailBySale] = await Promise.all([
      supabase.from("penjualan").select("*").eq("id", id).single(),
      loadLookupMaps(),
      loadDetailsForSales([id])
    ]);

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data
      ? toPenjualan(
          data as PenjualanRow,
          detailBySale[id] ?? [],
          lookupMaps.pelangganById
        )
      : null;
  },

  async checkout(payload: CheckoutPayload): Promise<Penjualan> {
    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.hargaJual * item.quantity,
      0
    );

    if (!isSupabaseConfigured || !supabase) {
      return localCheckout(payload);
    }

    const now = new Date().toISOString();
    const nomorPenjualan = generateNomorPenjualan(new Date(now));

    const { data, error } = await supabase
      .from("penjualan")
      .insert({
        nomor_penjualan: nomorPenjualan,
        pelanggan_id: payload.pelangganId || null,
        resep_id: payload.resepId || null,
        tanggal_penjualan: now,
        subtotal,
        diskon: 0,
        pajak: 0,
        total: subtotal,
        metode_pembayaran: payload.metodePembayaran,
        bayar: payload.bayar,
        kembalian: payload.bayar - subtotal,
        status: "selesai",
        created_at: now
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.items.length) {
      const { error: detailError } = await supabase
        .from("penjualan_detail")
        .insert(
          payload.items.map((item) => ({
            penjualan_id: data.id,
            obat_id: item.obatId,
            jumlah: item.quantity,
            harga_jual: item.hargaJual,
            diskon: 0,
            subtotal: item.hargaJual * item.quantity
          }))
        );

      if (detailError) {
        throw new Error(detailError.message);
      }

      const { error: stokError } = await supabase.from("stok").insert(
        payload.items.map((item) => ({
          obat_id: item.obatId,
          batch_number: `OUT-${nomorPenjualan}-${item.kodeObat}`,
          tanggal_expired: null,
          jumlah: -item.quantity,
          lokasi: "Kasir"
        }))
      );

      if (stokError) {
        throw new Error(stokError.message);
      }
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error("Penjualan berhasil dibuat, tetapi data tidak dapat dimuat ulang");
    }

    return created;
  }
};
