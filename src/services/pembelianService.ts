import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  Pembelian,
  PembelianDetail,
  StatusPembelian
} from "@/types";
import { matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface PembelianItemInput {
  obatId: number;
  batchNumber?: string;
  tanggalExpired?: string;
  jumlah: number;
  hargaBeli: number;
  diskon?: number;
}

export interface PembelianInput {
  nomorPembelian?: string;
  supplierId: number;
  tanggalPembelian: string;
  diskon?: number;
  pajak?: number;
  status?: StatusPembelian;
  catatan?: string;
  items: PembelianItemInput[];
}

interface PembelianRow {
  id: number;
  nomor_pembelian: string;
  supplier_id: number | null;
  tanggal_pembelian: string | null;
  subtotal: number | string | null;
  diskon: number | string | null;
  pajak: number | string | null;
  total: number | string | null;
  status: StatusPembelian | null;
  catatan: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PembelianDetailRow {
  id: number;
  pembelian_id: number | null;
  obat_id: number | null;
  batch_number: string | null;
  tanggal_expired: string | null;
  jumlah: number | null;
  harga_beli: number | string | null;
  diskon: number | string | null;
  subtotal: number | string | null;
}

interface StokRow {
  obat_id: number | null;
  jumlah: number | null;
}

const localPembelian: Pembelian[] = [];

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function generateNomorPembelian(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `PBL-${stamp}-${suffix}`;
}

function calculateLineSubtotal(item: PembelianItemInput) {
  return Math.max(0, item.jumlah * item.hargaBeli - (item.diskon ?? 0));
}

function calculateTotals(payload: PembelianInput) {
  const subtotal = payload.items.reduce(
    (sum, item) => sum + calculateLineSubtotal(item),
    0
  );
  const diskon = payload.diskon ?? 0;
  const pajak = payload.pajak ?? 0;
  const total = Math.max(0, subtotal - diskon + pajak);

  return { subtotal, diskon, pajak, total };
}

function stockMapFrom(rows: StokRow[]) {
  return rows.reduce<Record<number, number>>((acc, row) => {
    if (!row.obat_id) {
      return acc;
    }

    acc[row.obat_id] = (acc[row.obat_id] ?? 0) + Number(row.jumlah ?? 0);
    return acc;
  }, {});
}

function toDetail(
  row: PembelianDetailRow,
  obatById: Record<number, string> = {}
): PembelianDetail {
  const obatId = row.obat_id ?? 0;

  return {
    id: row.id,
    pembelianId: row.pembelian_id ?? 0,
    obatId,
    namaObat: obatById[obatId] ?? "-",
    batchNumber: row.batch_number ?? "",
    tanggalExpired: row.tanggal_expired ?? "",
    jumlah: row.jumlah ?? 0,
    hargaBeli: toNumber(row.harga_beli),
    diskon: toNumber(row.diskon),
    subtotal: toNumber(row.subtotal)
  };
}

function toPembelian(
  row: PembelianRow,
  details: PembelianDetail[] = [],
  supplierById: Record<number, string> = {}
): Pembelian {
  const supplierId = row.supplier_id ?? 0;

  return {
    id: row.id,
    nomorPembelian: row.nomor_pembelian,
    supplierId,
    namaSupplier: supplierById[supplierId] ?? "-",
    tanggalPembelian: row.tanggal_pembelian ?? "",
    subtotal: toNumber(row.subtotal),
    diskon: toNumber(row.diskon),
    pajak: toNumber(row.pajak),
    total: toNumber(row.total),
    status: row.status ?? "draft",
    catatan: row.catatan ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    details
  };
}

function filterPembelian(rows: Pembelian[], search?: string) {
  return matchSearch(rows, search, [
    "nomorPembelian",
    "namaSupplier",
    "status"
  ]);
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      supplierById: {} as Record<number, string>,
      obatById: {} as Record<number, string>
    };
  }

  const [supplierResult, obatResult] = await Promise.all([
    supabase.from("supplier").select("id,nama_supplier"),
    supabase.from("obat").select("id,nama_obat")
  ]);

  if (supplierResult.error) {
    throw new Error(supplierResult.error.message);
  }

  if (obatResult.error) {
    throw new Error(obatResult.error.message);
  }

  return {
    supplierById: Object.fromEntries(
      (supplierResult.data ?? []).map((item) => [item.id, item.nama_supplier])
    ),
    obatById: Object.fromEntries(
      (obatResult.data ?? []).map((item) => [item.id, item.nama_obat])
    )
  };
}

async function loadDetailsForPembelian(ids: number[]) {
  if (!supabase || !ids.length) {
    return {} as Record<number, PembelianDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase.from("pembelian_detail").select("*").in("pembelian_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<number, PembelianDetail[]>>((acc, row) => {
    const detail = toDetail(row, lookupMaps.obatById);
    acc[detail.pembelianId] = [...(acc[detail.pembelianId] ?? []), detail];
    return acc;
  }, {});
}

async function receiveStock(pembelian: Pembelian) {
  if (!isSupabaseConfigured || !supabase || !pembelian.details.length) {
    return;
  }

  const validDetails = pembelian.details.filter(
    (detail) => detail.obatId > 0 && detail.jumlah > 0
  );

  if (!validDetails.length) {
    return;
  }

  const obatIds = [...new Set(validDetails.map((detail) => detail.obatId))];
  const { data: stokRows, error: stokError } = await supabase
    .from("stok")
    .select("obat_id,jumlah")
    .in("obat_id", obatIds);

  if (stokError) {
    throw new Error(stokError.message);
  }

  const stockByObat = stockMapFrom(stokRows ?? []);

  const stokInserts = validDetails.map((detail, index) => ({
    obat_id: detail.obatId,
    batch_number:
      detail.batchNumber ||
      `${pembelian.nomorPembelian}-${String(index + 1).padStart(2, "0")}`,
    tanggal_expired: detail.tanggalExpired || null,
    jumlah: detail.jumlah,
    lokasi: "Gudang pembelian"
  }));

  const mutasiInserts = validDetails.map((detail) => {
    const stokSebelum = stockByObat[detail.obatId] ?? 0;
    const stokSesudah = stokSebelum + detail.jumlah;
    stockByObat[detail.obatId] = stokSesudah;

    return {
      obat_id: detail.obatId,
      tipe_mutasi: "masuk",
      jumlah: detail.jumlah,
      sumber: "pembelian",
      referensi_id: pembelian.id,
      stok_sebelum: stokSebelum,
      stok_sesudah: stokSesudah,
      keterangan: `Pembelian ${pembelian.nomorPembelian}`
    };
  });

  const { error: insertStokError } = await supabase.from("stok").insert(stokInserts);

  if (insertStokError) {
    throw new Error(insertStokError.message);
  }

  const { error: mutasiError } = await supabase
    .from("stok_mutasi")
    .insert(mutasiInserts);

  if (mutasiError) {
    throw new Error(mutasiError.message);
  }
}

export const pembelianService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterPembelian(localPembelian, params.search), params);
    }

    const [{ data, error }, lookupMaps] = await Promise.all([
      supabase
        .from("pembelian")
        .select("*")
        .order("created_at", { ascending: false }),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    const detailByPembelian = await loadDetailsForPembelian(
      (data ?? []).map((item) => item.id)
    );

    const rows = filterPembelian(
      (data ?? []).map((item) =>
        toPembelian(
          item,
          detailByPembelian[item.id] ?? [],
          lookupMaps.supplierById
        )
      ),
      params.search
    );

    return paginate(rows, params);
  },

  async getById(id: number) {
    if (!isSupabaseConfigured || !supabase) {
      return localPembelian.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, lookupMaps, detailByPembelian] = await Promise.all([
      supabase.from("pembelian").select("*").eq("id", id).single(),
      loadLookupMaps(),
      loadDetailsForPembelian([id])
    ]);

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data
      ? toPembelian(
          data,
          detailByPembelian[id] ?? [],
          lookupMaps.supplierById
        )
      : null;
  },

  async create(payload: PembelianInput): Promise<Pembelian> {
    const totals = calculateTotals(payload);
    const status = payload.status ?? "draft";
    const nomorPembelian =
      payload.nomorPembelian?.trim() ||
      generateNomorPembelian(new Date(payload.tanggalPembelian || Date.now()));

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const id = Date.now();
      const created: Pembelian = {
        id,
        nomorPembelian,
        supplierId: payload.supplierId,
        namaSupplier: "-",
        tanggalPembelian: payload.tanggalPembelian,
        subtotal: totals.subtotal,
        diskon: totals.diskon,
        pajak: totals.pajak,
        total: totals.total,
        status,
        catatan: payload.catatan ?? "",
        createdBy: "",
        createdAt: now,
        updatedAt: now,
        details: payload.items.map((item, index) => ({
          id: index + 1,
          pembelianId: id,
          obatId: item.obatId,
          namaObat: "-",
          batchNumber: item.batchNumber ?? "",
          tanggalExpired: item.tanggalExpired ?? "",
          jumlah: item.jumlah,
          hargaBeli: item.hargaBeli,
          diskon: item.diskon ?? 0,
          subtotal: calculateLineSubtotal(item)
        }))
      };

      localPembelian.unshift(created);
      return created;
    }

    const { data, error } = await supabase
      .from("pembelian")
      .insert({
        nomor_pembelian: nomorPembelian,
        supplier_id: payload.supplierId,
        tanggal_pembelian: payload.tanggalPembelian || null,
        subtotal: totals.subtotal,
        diskon: totals.diskon,
        pajak: totals.pajak,
        total: totals.total,
        status,
        catatan: payload.catatan ?? "",
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.items.length) {
      const { error: detailError } = await supabase
        .from("pembelian_detail")
        .insert(
          payload.items.map((item) => ({
            pembelian_id: data.id,
            obat_id: item.obatId,
            batch_number: item.batchNumber ?? "",
            tanggal_expired: item.tanggalExpired || null,
            jumlah: item.jumlah,
            harga_beli: item.hargaBeli,
            diskon: item.diskon ?? 0,
            subtotal: calculateLineSubtotal(item)
          }))
        );

      if (detailError) {
        throw new Error(detailError.message);
      }
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error(
        "Pembelian berhasil dibuat, tetapi data tidak dapat dimuat ulang"
      );
    }

    if (created.status === "diterima") {
      await receiveStock(created);
    }

    return created;
  },

  async receive(id: number) {
    const pembelian = await this.getById(id);

    if (!pembelian) {
      throw new Error("Pembelian tidak ditemukan");
    }

    if (pembelian.status === "diterima") {
      return pembelian;
    }

    if (pembelian.status === "dibatalkan") {
      throw new Error("Pembelian dibatalkan tidak bisa diterima");
    }

    if (!isSupabaseConfigured || !supabase) {
      const index = localPembelian.findIndex((item) => item.id === id);
      if (index >= 0) {
        localPembelian[index] = {
          ...localPembelian[index],
          status: "diterima",
          updatedAt: new Date().toISOString()
        };
      }

      return localPembelian[index] ?? pembelian;
    }

    await receiveStock(pembelian);

    const { error } = await supabase
      .from("pembelian")
      .update({
        status: "diterima",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const updated = await this.getById(id);
    return updated ?? { ...pembelian, status: "diterima" as const };
  }
};
