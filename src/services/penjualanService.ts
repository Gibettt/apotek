import { penjualan as initialPenjualan, defaultCabangId } from "@/lib/mock-data";
import { stockQtyForSale } from "@/lib/eceran";
import { resolveActivePrices, type ActivePrice } from "@/lib/pricing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { jurnalService, resolveAkunIdByKode } from "./jurnalService";
import type {
  CartItem,
  MetodePembayaran,
  Penjualan,
  PenjualanDetail,
  StatusBayar,
  StatusPenjualan
} from "@/types";
import { getCurrentUserId, matchSearch, paginate, type ListParams } from "./serviceUtils";

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
const localPenjualanStorageKey = "apotek-penjualan";
let localPenjualanHydrated = false;

function hydrateLocalPenjualan() {
  if (localPenjualanHydrated || typeof window === "undefined") return;
  localPenjualanHydrated = true;

  try {
    const stored = window.localStorage.getItem(localPenjualanStorageKey);
    const rows = stored ? (JSON.parse(stored) as Penjualan[]) : [];
    for (const row of [...rows].reverse()) {
      if (row?.id && !localPenjualan.some((item) => item.id === row.id)) {
        localPenjualan.unshift(row);
      }
    }
  } catch {
    window.localStorage.removeItem(localPenjualanStorageKey);
  }
}

function persistLocalPenjualan() {
  if (typeof window === "undefined") return;
  const customRows = localPenjualan.filter(
    (item) => !initialPenjualan.some((initial) => initial.id === item.id)
  );
  window.localStorage.setItem(
    localPenjualanStorageKey,
    JSON.stringify(customRows)
  );
}

function addLocalPenjualan(penjualan: Penjualan) {
  hydrateLocalPenjualan();
  const index = localPenjualan.findIndex((item) => item.id === penjualan.id);
  if (index >= 0) localPenjualan.splice(index, 1);
  localPenjualan.unshift(penjualan);
  persistLocalPenjualan();
}

async function resolvePenggunaId(): Promise<string | null> {
  const current = getCurrentUserId();

  if (!isSupabaseConfigured || !supabase || !current) {
    return null;
  }

  const { data } = await supabase
    .from("pengguna")
    .select("id")
    .eq("id", current)
    .maybeSingle();

  return data?.id ? (data.id as string) : null;
}

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
      obatById: {} as Record<string, string>,
      hargaJualById: {} as Record<string, number>,
      satuanById: {} as Record<string, string>
    };
  }

  const [pelangganResult, obatResult, hargaResult, satuanResult] = await Promise.all([
    supabase.from("pelanggan").select("id,nama"),
    supabase.from("barang").select("id,nama"),
    supabase
      .from("harga_barang")
      .select("barang_id,harga_jual,tanggal_mulai")
      .eq("aktif", true)
      .gt("harga_jual", 0)
      .order("tanggal_mulai", { ascending: false }),
    supabase.from("satuan").select("id,nama")
  ]);

  if (pelangganResult.error) {
    throw new Error(pelangganResult.error.message);
  }

  if (obatResult.error) {
    throw new Error(obatResult.error.message);
  }

  if (hargaResult.error) {
    throw new Error(hargaResult.error.message);
  }

  if (satuanResult.error) {
    throw new Error(satuanResult.error.message);
  }

  return {
    pelangganById: Object.fromEntries(
      (pelangganResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    obatById: Object.fromEntries(
      (obatResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    hargaJualById: (hargaResult.data ?? []).reduce<Record<string, number>>(
      (acc, item) => {
        if (!acc[item.barang_id]) {
          acc[item.barang_id] = Number(item.harga_jual ?? 0);
        }
        return acc;
      },
      {}
    ),
    satuanById: Object.fromEntries(
      (satuanResult.data ?? []).map((item) => [item.id, item.nama])
    )
  };
}

async function loadResepIdBySale(ids: string[]) {
  if (!supabase || !ids.length) {
    return {} as Record<string, string>;
  }

  const { data, error } = await supabase
    .from("resep")
    .select("id,penjualan_id")
    .in("penjualan_id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, string>>((acc, row) => {
    if (row.penjualan_id) {
      acc[row.penjualan_id] = row.id;
    }
    return acc;
  }, {});
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
  obatById: Record<string, string> = {},
  hargaJualById: Record<string, number> = {},
  satuanById: Record<string, string> = {}
): PenjualanDetail {
  const barangId = row.barang_id ?? "";
  const satuanId = row.satuan_id ?? undefined;
  const { jumlah, hargaJual, subtotal } = resolvePenjualanDetailAmounts(
    row,
    hargaJualById[barangId] || 0
  );

  return {
    id: row.id,
    penjualanId: row.penjualan_id ?? "",
    barangId,
    namaBarang: obatById[barangId] ?? "-",
    batchId: row.batch_id ?? undefined,
    satuanId,
    satuanNama: satuanId ? satuanById[satuanId] : undefined,
    jumlah,
    hargaJual,
    diskonPersen: Number(row.diskon_persen ?? 0),
    diskonNominal: Number(row.diskon_nominal ?? 0),
    subtotal,
    hargaPokok: Number(row.harga_pokok ?? 0)
  };
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export function resolvePenjualanDetailAmounts(
  row: Pick<PenjualanDetailRow, "qty" | "harga_jual" | "subtotal">,
  fallbackHargaJual = 0
) {
  const jumlah = Number(row.qty ?? 0);
  const hargaJual = Number(row.harga_jual ?? 0) || fallbackHargaJual;
  const subtotal = Number(row.subtotal ?? 0) || hargaJual * jumlah;

  return { jumlah, hargaJual, subtotal };
}

export function resolvePenjualanGrandTotalForDisplay(
  row: Pick<
    PenjualanRow,
    "grand_total" | "bayar_total" | "kembalian" | "status_bayar"
  >,
  details: Array<Pick<PenjualanDetail, "subtotal">>
) {
  const grandTotal = toNumber(row.grand_total);
  if (grandTotal > 0) {
    return grandTotal;
  }

  const detailTotal = details.reduce((sum, detail) => sum + detail.subtotal, 0);
  if (detailTotal > 0) {
    return detailTotal;
  }

  const bayarTotal = toNumber(row.bayar_total);
  const paidNetTotal = bayarTotal - toNumber(row.kembalian);
  return row.status_bayar === "lunas" && paidNetTotal > 0
    ? paidNetTotal
    : grandTotal;
}

function toPenjualan(
  row: PenjualanRow,
  details: PenjualanDetail[] = [],
  pelangganById: Record<string, string> = {},
  metodeById: Record<string, MetodePembayaran> = {},
  resepIdBySale: Record<string, string> = {}
): Penjualan {
  const pelangganId = row.pelanggan_id ?? undefined;
  const subtotal = toNumber(row.subtotal);
  const grandTotal = resolvePenjualanGrandTotalForDisplay(row, details);

  return {
    id: row.id,
    cabangId: row.cabang_id ?? "",
    shiftKasirId: row.shift_kasir_id ?? undefined,
    nomorInvoice: row.nomor_invoice,
    pelangganId,
    namaPelanggan: pelangganId ? pelangganById[pelangganId] ?? "Pelanggan" : "Umum",
    resepId: resepIdBySale[row.id] ?? undefined,
    tanggal: row.tanggal ?? row.created_at ?? "",
    tipePenjualan: row.tipe_penjualan ?? "umum",
    subtotal: subtotal || grandTotal,
    diskonTotal: toNumber(row.diskon_total),
    pajakTotal: toNumber(row.pajak_total),
    grandTotal,
    bayarTotal: toNumber(row.bayar_total),
    kembalian: toNumber(row.kembalian),
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
      const detail = toDetail(row, lookupMaps.obatById, lookupMaps.hargaJualById, lookupMaps.satuanById);
      acc[detail.penjualanId] = [...(acc[detail.penjualanId] ?? []), detail];
      return acc;
    },
    {}
  );
}

/** Resolves each cart line's real sell price and cost basis so kartu_stok/penjualan_detail never fall back to the selling price as cost. */
export function resolveCheckoutItems(
  items: CartItem[],
  hargaByBarang: Record<string, ActivePrice>
) {
  return items.map((item) => ({
    ...item,
    stockQuantity: stockQtyForSale(item.quantity, item.stockQtyPerUnit ?? 1),
    hargaJual:
      item.tipeHarga !== "eceran" &&
      (hargaByBarang[item.barangId]?.hargaJual ?? 0) > 0
        ? hargaByBarang[item.barangId].hargaJual
        : item.hargaJual,
    hargaPokok:
      (hargaByBarang[item.barangId]?.hargaBeli ?? 0) *
      (item.stockQtyPerUnit ?? 1)
  }));
}

function localCheckout(payload: CheckoutPayload): Penjualan {
  hydrateLocalPenjualan();
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
      satuanId: item.satuanId,
      satuanNama: item.satuanNama,
      jumlah: item.quantity,
      hargaJual: item.hargaJual,
      diskonPersen: 0,
      diskonNominal: 0,
      subtotal: item.hargaJual * item.quantity,
      hargaPokok: 0
    }))
  };

  addLocalPenjualan(created);
  return created;
}

async function assertStockAvailability(cabangId: string, items: CartItem[]) {
  if (!supabase || !items.length) {
    return;
  }

  const barangIds = items.map((item) => item.barangId);
  const { data, error } = await supabase
    .from("saldo_stok")
    .select("barang_id,qty")
    .eq("cabang_id", cabangId)
    .in("barang_id", barangIds);

  if (error) {
    throw new Error(error.message);
  }

  const availableByBarang = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const id = row.barang_id as string;
    acc[id] = (acc[id] ?? 0) + Number(row.qty ?? 0);
    return acc;
  }, {});

  const requestedByBarang = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.barangId] =
      (acc[item.barangId] ?? 0) +
      stockQtyForSale(item.quantity, item.stockQtyPerUnit ?? 1);
    return acc;
  }, {});

  for (const item of items) {
    const available = availableByBarang[item.barangId] ?? 0;
    const requested = requestedByBarang[item.barangId] ?? 0;
    if (requested > available) {
      throw new Error(
        `Stok ${item.nama} tidak mencukupi. Tersedia ${available}, diminta ${requested}.`
      );
    }
  }
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

// ponytail: BPJS/accurate settle to bank same as transfer — no separate piutang tracking yet.
export function resolveKasAkunKode(metodePembayaran: string) {
  return metodePembayaran === "tunai" ? { kode: "1-100", nama: "Kas" } : { kode: "1-110", nama: "Bank" };
}

/** Balanced jurnal_umum_detail rows for a sale: cash/bank in, revenue recognized, inventory drawn down at cost. */
export function buildPenjualanJurnalDetails(input: {
  grandTotal: number;
  totalHpp: number;
  nomorInvoice: string;
  akunIds: { kas: string; pendapatan: string; persediaan: string; hpp: string };
}) {
  const details = [
    {
      akunId: input.akunIds.kas,
      debit: input.grandTotal,
      kredit: 0,
      keterangan: `Penerimaan penjualan ${input.nomorInvoice}`
    },
    { akunId: input.akunIds.pendapatan, debit: 0, kredit: input.grandTotal, keterangan: `Penjualan ${input.nomorInvoice}` }
  ];

  if (input.totalHpp > 0) {
    details.push(
      { akunId: input.akunIds.hpp, debit: input.totalHpp, kredit: 0, keterangan: `HPP ${input.nomorInvoice}` },
      {
        akunId: input.akunIds.persediaan,
        debit: 0,
        kredit: input.totalHpp,
        keterangan: `Pengurangan persediaan ${input.nomorInvoice}`
      }
    );
  }

  return details.filter((detail) => detail.debit > 0 || detail.kredit > 0);
}

/** Books the sale into the ledger: cash/bank in, revenue recognized, inventory drawn down at cost. */
async function postPenjualanJurnal(
  sale: Penjualan,
  resolvedItems: Array<{ hargaPokok: number; quantity: number }>,
  cabangId: string
) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const totalHpp = resolvedItems.reduce((sum, item) => sum + item.hargaPokok * item.quantity, 0);
  const kas = resolveKasAkunKode(sale.metodePembayaran ?? "tunai");

  const [kasId, pendapatanId, persediaanId, hppId] = await Promise.all([
    resolveAkunIdByKode(kas.kode, kas.nama, "Aset"),
    resolveAkunIdByKode("4-100", "Pendapatan Penjualan", "Pendapatan"),
    resolveAkunIdByKode("1-200", "Persediaan Obat", "Aset"),
    resolveAkunIdByKode("5-000", "Beban Pokok Penjualan", "Beban")
  ]);

  if (!kasId || !pendapatanId || !persediaanId || !hppId) {
    return;
  }

  const details = buildPenjualanJurnalDetails({
    grandTotal: sale.grandTotal,
    totalHpp,
    nomorInvoice: sale.nomorInvoice,
    akunIds: { kas: kasId, pendapatan: pendapatanId, persediaan: persediaanId, hpp: hppId }
  });

  await jurnalService.create({
    tanggal: sale.tanggal.slice(0, 10),
    nomorReferensi: sale.nomorInvoice,
    deskripsi: `Penjualan ${sale.nomorInvoice}`,
    cabangId,
    status: "diposting",
    sumber: "penjualan",
    sumberTabel: "penjualan",
    sumberId: sale.id,
    details
  });
}

export const penjualanService = {
  async list(params: ListParams = {}) {
    hydrateLocalPenjualan();

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

    const [detailBySale, metodeById, resepIdBySale] = await Promise.all([
      loadDetailsForSales(ids),
      loadMetodeBySale(ids),
      loadResepIdBySale(ids)
    ]);

    const result = filterPenjualan(
      rows.map((item) =>
        toPenjualan(
          item,
          detailBySale[item.id] ?? [],
          lookupMaps.pelangganById,
          metodeById,
          resepIdBySale
        )
      ),
      params.search
    );

    return paginate(result, params);
  },

  async getById(id: string) {
    hydrateLocalPenjualan();

    if (!isSupabaseConfigured || !supabase) {
      return localPenjualan.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, lookupMaps, detailBySale, metodeById, resepIdBySale] = await Promise.all([
      supabase.from("penjualan").select("*").eq("id", id).single(),
      loadLookupMaps(),
      loadDetailsForSales([id]),
      loadMetodeBySale([id]),
      loadResepIdBySale([id])
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
          metodeById,
          resepIdBySale
        )
      : null;
  },

  async checkout(payload: CheckoutPayload): Promise<Penjualan> {
    if (!isSupabaseConfigured || !supabase) {
      return localCheckout(payload);
    }

    const cabangId = await resolveCabangId(payload.cabangId);
    await assertStockAvailability(cabangId, payload.items);
    const barangIds = payload.items.map((item) => item.barangId);
    const hargaByBarang = await resolveActivePrices(barangIds, cabangId);

    const resolvedItems = resolveCheckoutItems(payload.items, hargaByBarang);

    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.hargaJual * item.quantity,
      0
    );
    const now = new Date().toISOString();
    const nomorInvoice = generateNomorInvoice(new Date(now));
    const dibuatOleh = await resolvePenggunaId();

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
        dibuat_oleh: dibuatOleh,
        updated_at: now
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.resepId) {
      const { error: resepLinkError } = await supabase
        .from("resep")
        .update({ penjualan_id: data.id })
        .eq("id", payload.resepId);

      if (resepLinkError) {
        throw new Error(resepLinkError.message);
      }
    }

    if (resolvedItems.length) {
      const { error: detailError } = await supabase.from("penjualan_detail").insert(
        resolvedItems.map((item) => ({
          penjualan_id: data.id,
          barang_id: item.barangId,
          satuan_id: item.satuanId ?? null,
          qty: item.quantity,
          harga_jual: item.hargaJual,
          diskon_persen: 0,
          diskon_nominal: 0,
          subtotal: item.hargaJual * item.quantity,
          harga_pokok: item.hargaPokok
        }))
      );

      if (detailError) {
        throw new Error(detailError.message);
      }

      for (const item of resolvedItems) {
        await decrementStock(
          cabangId,
          item.barangId,
          item.stockQuantity,
          data.id,
          item.hargaPokok
        );
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

    try {
      await postPenjualanJurnal(created, resolvedItems, cabangId);
    } catch (error) {
      console.warn("Jurnal otomatis penjualan gagal dibuat.", error);
    }

    return created;
  }
};
