import { penjualan as initialPenjualan, defaultCabangId } from "@/lib/mock-data";
import { resolveActivePrices } from "@/lib/pricing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  CartItem,
  MetodePembayaran,
  Penjualan,
  PenjualanDetail,
  StatusBayar,
  StatusPenjualan
} from "@/types";
import { matchSearch, paginate, type ListParams } from "./serviceUtils";

interface PenjualanRow {
  id: string;
  cabang_id: string | null;
  shift_kasir_id: string | null;
  pelanggan_id: string | null;
  nomor_invoice: string;
  tanggal: string | null;
  tipe_penjualan: string | null;
  subtotal: number | string | null;
  diskon_total: number | string | null;
  pajak_total: number | string | null;
  grand_total: number | string | null;
  bayar_total: number | string | null;
  kembalian: number | string | null;
  status_bayar: StatusBayar | null;
  status: StatusPenjualan | null;
  catatan: string | null;
  dibuat_oleh: string | null;
  created_at: string | null;
}

interface PenjualanDetailRow {
  id: string;
  penjualan_id: string | null;
  barang_id: string | null;
  batch_id: string | null;
  satuan_id: string | null;
  qty: number | null;
  harga_jual: number | string | null;
  diskon_persen: number | string | null;
  diskon_nominal: number | string | null;
  subtotal: number | string | null;
  harga_pokok: number | string | null;
}

interface CheckoutPayload {
  items: CartItem[];
  metodePembayaran: MetodePembayaran;
  bayar: number;
  pelangganId?: string;
  resepId?: string;
  cabangId?: string;
  tipePenjualan?: string;
}

const localPenjualan: Penjualan[] = [...initialPenjualan];

async function resolveCabangId(cabangId?: string) {
  if (!supabase) {
    return cabangId || defaultCabangId;
  }

  if (cabangId) {
    const { data, error } = await supabase
      .from("cabang")
      .select("id")
      .eq("id", cabangId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data?.id) {
      return data.id as string;
    }
  }

  const { data, error } = await supabase
    .from("cabang")
    .select("id")
    .eq("aktif", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Cabang aktif belum tersedia. Tambahkan cabang terlebih dahulu.");
  }

  return data.id as string;
}

function generateNomorInvoice(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `PJL-${stamp}-${suffix}`;
}

function filterPenjualan(rows: Penjualan[], search?: string) {
  return matchSearch(rows, search, [
    "nomorInvoice",
    "namaPelanggan",
    "metodePembayaran",
    "status"
  ]);
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      pelangganById: {} as Record<string, string>,
      obatById: {} as Record<string, string>
    };
  }

  const [pelangganResult, obatResult] = await Promise.all([
    supabase.from("pelanggan").select("id,nama"),
    supabase.from("barang").select("id,nama")
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
      (obatResult.data ?? []).map((item) => [item.id, item.nama])
    )
  };
}

async function loadMetodeBySale(ids: string[]) {
  if (!supabase || !ids.length) {
    return {} as Record<string, MetodePembayaran>;
  }

  const { data, error } = await supabase
    .from("pembayaran")
    .select("penjualan_id,metode")
    .in("penjualan_id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, MetodePembayaran>>((acc, row) => {
    if (row.penjualan_id && !acc[row.penjualan_id]) {
      acc[row.penjualan_id] = row.metode as MetodePembayaran;
    }
    return acc;
  }, {});
}

function toDetail(
  row: PenjualanDetailRow,
  obatById: Record<string, string> = {}
): PenjualanDetail {
  const barangId = row.barang_id ?? "";

  return {
    id: row.id,
    penjualanId: row.penjualan_id ?? "",
    barangId,
    namaBarang: obatById[barangId] ?? "-",
    batchId: row.batch_id ?? undefined,
    satuanId: row.satuan_id ?? undefined,
    jumlah: Number(row.qty ?? 0),
    hargaJual: Number(row.harga_jual ?? 0),
    diskonPersen: Number(row.diskon_persen ?? 0),
    diskonNominal: Number(row.diskon_nominal ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    hargaPokok: Number(row.harga_pokok ?? 0)
  };
}

function toPenjualan(
  row: PenjualanRow,
  details: PenjualanDetail[] = [],
  pelangganById: Record<string, string> = {},
  metodeById: Record<string, MetodePembayaran> = {}
): Penjualan {
  const pelangganId = row.pelanggan_id ?? undefined;

  return {
    id: row.id,
    cabangId: row.cabang_id ?? "",
    shiftKasirId: row.shift_kasir_id ?? undefined,
    nomorInvoice: row.nomor_invoice,
    pelangganId,
    namaPelanggan: pelangganId ? pelangganById[pelangganId] ?? "Pelanggan" : "Umum",
    tanggal: row.tanggal ?? row.created_at ?? "",
    tipePenjualan: row.tipe_penjualan ?? "umum",
    subtotal: Number(row.subtotal ?? 0),
    diskonTotal: Number(row.diskon_total ?? 0),
    pajakTotal: Number(row.pajak_total ?? 0),
    grandTotal: Number(row.grand_total ?? 0),
    bayarTotal: Number(row.bayar_total ?? 0),
    kembalian: Number(row.kembalian ?? 0),
    statusBayar: row.status_bayar ?? "belum_bayar",
    status: row.status ?? "selesai",
    metodePembayaran: metodeById[row.id],
    catatan: row.catatan ?? "",
    createdBy: row.dibuat_oleh ?? "",
    createdAt: row.created_at ?? "",
    details
  };
}

async function loadDetailsForSales(ids: string[]) {
  if (!supabase || !ids.length) {
    return {} as Record<string, PenjualanDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase.from("penjualan_detail").select("*").in("penjualan_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PenjualanDetailRow[]).reduce<Record<string, PenjualanDetail[]>>(
    (acc, row) => {
      const detail = toDetail(row, lookupMaps.obatById);
      acc[detail.penjualanId] = [...(acc[detail.penjualanId] ?? []), detail];
      return acc;
    },
    {}
  );
}

function localCheckout(payload: CheckoutPayload): Penjualan {
  const subtotal = payload.items.reduce(
    (sum, item) => sum + item.hargaJual * item.quantity,
    0
  );
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const created: Penjualan = {
    id,
    cabangId: payload.cabangId || defaultCabangId,
    nomorInvoice: generateNomorInvoice(new Date(now)),
    pelangganId: payload.pelangganId,
    namaPelanggan: payload.pelangganId ? "Pelanggan terdaftar" : "Umum",
    resepId: payload.resepId,
    tanggal: now,
    tipePenjualan: payload.tipePenjualan ?? "umum",
    subtotal,
    diskonTotal: 0,
    pajakTotal: 0,
    grandTotal: subtotal,
    bayarTotal: payload.bayar,
    kembalian: payload.bayar - subtotal,
    statusBayar: payload.bayar >= subtotal ? "lunas" : "sebagian",
    status: "selesai",
    metodePembayaran: payload.metodePembayaran,
    createdBy: "local-user",
    createdAt: now,
    details: payload.items.map((item) => ({
      id: crypto.randomUUID(),
      penjualanId: id,
      barangId: item.barangId,
      namaBarang: item.nama,
      jumlah: item.quantity,
      hargaJual: item.hargaJual,
      diskonPersen: 0,
      diskonNominal: 0,
      subtotal: item.hargaJual * item.quantity,
      hargaPokok: 0
    }))
  };

  localPenjualan.unshift(created);
  return created;
}

async function decrementStock(
  cabangId: string,
  barangId: string,
  qty: number,
  penjualanId: string,
  hargaPokok: number
) {
  if (!supabase) {
    return;
  }

  let remaining = qty;

  const { data: rows, error } = await supabase
    .from("saldo_stok")
    .select("id,qty,batch_id")
    .eq("cabang_id", cabangId)
    .eq("barang_id", barangId)
    .gt("qty", 0)
    .order("updated_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  for (const row of rows ?? []) {
    if (remaining <= 0) {
      break;
    }

    const take = Math.min(Number(row.qty ?? 0), remaining);
    if (take <= 0) {
      continue;
    }

    const saldoAkhir = Number(row.qty ?? 0) - take;
    const { error: updateError } = await supabase
      .from("saldo_stok")
      .update({ qty: saldoAkhir, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: kartuError } = await supabase.from("kartu_stok").insert({
      cabang_id: cabangId,
      barang_id: barangId,
      batch_id: row.batch_id ?? null,
      tipe_mutasi: "keluar",
      sumber_tabel: "penjualan",
      sumber_id: penjualanId,
      qty_masuk: 0,
      qty_keluar: take,
      saldo_akhir: saldoAkhir,
      harga_pokok: hargaPokok,
      keterangan: `Penjualan ${penjualanId}`
    });

    if (kartuError) {
      throw new Error(kartuError.message);
    }

    remaining -= take;
  }

  if (remaining > 0) {
    const { error: kartuError } = await supabase.from("kartu_stok").insert({
      cabang_id: cabangId,
      barang_id: barangId,
      batch_id: null,
      tipe_mutasi: "keluar",
      sumber_tabel: "penjualan",
      sumber_id: penjualanId,
      qty_masuk: 0,
      qty_keluar: remaining,
      saldo_akhir: 0,
      harga_pokok: hargaPokok,
      keterangan: `Penjualan ${penjualanId} (stok tidak mencukupi)`
    });

    if (kartuError) {
      throw new Error(kartuError.message);
    }
  }
}

export const penjualanService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterPenjualan(localPenjualan, params.search), params);
    }

    const [{ data, error }, lookupMaps] = await Promise.all([
      supabase.from("penjualan").select("*").order("tanggal", { ascending: false }),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as PenjualanRow[];
    const ids = rows.map((item) => item.id);

    const [detailBySale, metodeById] = await Promise.all([
      loadDetailsForSales(ids),
      loadMetodeBySale(ids)
    ]);

    const result = filterPenjualan(
      rows.map((item) =>
        toPenjualan(item, detailBySale[item.id] ?? [], lookupMaps.pelangganById, metodeById)
      ),
      params.search
    );

    return paginate(result, params);
  },

  async getById(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      return localPenjualan.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, lookupMaps, detailBySale, metodeById] = await Promise.all([
      supabase.from("penjualan").select("*").eq("id", id).single(),
      loadLookupMaps(),
      loadDetailsForSales([id]),
      loadMetodeBySale([id])
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
          lookupMaps.pelangganById,
          metodeById
        )
      : null;
  },

  async checkout(payload: CheckoutPayload): Promise<Penjualan> {
    if (!isSupabaseConfigured || !supabase) {
      return localCheckout(payload);
    }

    const cabangId = await resolveCabangId(payload.cabangId);
    const barangIds = payload.items.map((item) => item.barangId);
    const hargaByBarang = await resolveActivePrices(barangIds, cabangId);

    const resolvedItems = payload.items.map((item) => ({
      ...item,
      hargaJual: hargaByBarang[item.barangId]?.hargaJual ?? item.hargaJual
    }));

    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.hargaJual * item.quantity,
      0
    );
    const now = new Date().toISOString();
    const nomorInvoice = generateNomorInvoice(new Date(now));

    const { data, error } = await supabase
      .from("penjualan")
      .insert({
        cabang_id: cabangId,
        pelanggan_id: payload.pelangganId || null,
        nomor_invoice: nomorInvoice,
        tanggal: now,
        tipe_penjualan: payload.tipePenjualan ?? "umum",
        subtotal,
        diskon_total: 0,
        pajak_total: 0,
        grand_total: subtotal,
        bayar_total: payload.bayar,
        kembalian: payload.bayar - subtotal,
        status_bayar: payload.bayar >= subtotal ? "lunas" : "sebagian",
        status: "selesai",
        updated_at: now
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (resolvedItems.length) {
      const { error: detailError } = await supabase.from("penjualan_detail").insert(
        resolvedItems.map((item) => ({
          penjualan_id: data.id,
          barang_id: item.barangId,
          qty: item.quantity,
          harga_jual: item.hargaJual,
          diskon_persen: 0,
          diskon_nominal: 0,
          subtotal: item.hargaJual * item.quantity,
          harga_pokok: 0
        }))
      );

      if (detailError) {
        throw new Error(detailError.message);
      }

      for (const item of resolvedItems) {
        await decrementStock(cabangId, item.barangId, item.quantity, data.id, item.hargaJual);
      }
    }

    const { error: pembayaranError } = await supabase.from("pembayaran").insert({
      penjualan_id: data.id,
      metode: payload.metodePembayaran,
      jumlah: payload.bayar,
      waktu_bayar: now
    });

    if (pembayaranError) {
      throw new Error(pembayaranError.message);
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error("Penjualan berhasil dibuat, tetapi data tidak dapat dimuat ulang");
    }

    return created;
  }
};
