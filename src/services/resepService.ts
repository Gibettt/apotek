import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Resep, ResepDetail, StatusResep } from "@/types";
import { matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface ResepDetailInput {
  obatId: number;
  aturanPakai: string;
  jumlah: number;
  catatan?: string;
}

export interface ResepInput {
  nomorResep?: string;
  pelangganId?: number;
  pelangganNama?: string;
  pelangganTelepon?: string;
  namaDokter: string;
  noSipDokter: string;
  asalPuskesmas?: string;
  tanggalResep: string;
  catatan?: string;
  status?: StatusResep;
  details: ResepDetailInput[];
}

export interface MasterOption {
  id: number;
  label: string;
}

interface ResepRow {
  id: number;
  nomor_resep: string;
  pelanggan_id: number | null;
  penjualan_id: number | null;
  nama_dokter: string | null;
  no_sip_dokter: string | null;
  asal_puskesmas: string | null;
  tanggal_resep: string | null;
  catatan: string | null;
  status: StatusResep | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ResepDetailRow {
  id: number;
  resep_id: number | null;
  obat_id: number | null;
  aturan_pakai: string | null;
  jumlah: number | null;
  catatan: string | null;
}

const localResep: Resep[] = [];

function generateNomorResep(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `RSP-${stamp}-${suffix}`;
}

function toDetail(
  row: ResepDetailRow,
  obatById: Record<number, string> = {}
): ResepDetail {
  const obatId = row.obat_id ?? 0;

  return {
    id: row.id,
    resepId: row.resep_id ?? 0,
    obatId,
    namaObat: obatById[obatId] ?? "-",
    aturanPakai: row.aturan_pakai ?? "",
    jumlah: row.jumlah ?? 0,
    catatan: row.catatan ?? ""
  };
}

function toResep(
  row: ResepRow,
  details: ResepDetail[] = [],
  pelangganById: Record<number, string> = {}
): Resep {
  const pelangganId = row.pelanggan_id ?? 0;

  return {
    id: row.id,
    nomorResep: row.nomor_resep,
    pelangganId,
    namaPelanggan: pelangganById[pelangganId] ?? "-",
    penjualanId: row.penjualan_id ?? undefined,
    namaDokter: row.nama_dokter ?? "",
    noSipDokter: row.no_sip_dokter ?? "",
    asalPuskesmas: row.asal_puskesmas ?? "",
    tanggalResep: row.tanggal_resep ?? "",
    catatan: row.catatan ?? "",
    status: row.status ?? "menunggu",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    details
  };
}

function filterResep(rows: Resep[], search?: string) {
  return matchSearch(rows, search, [
    "nomorResep",
    "namaPelanggan",
    "namaDokter",
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

async function loadDetailsForResep(ids: number[]) {
  if (!supabase || !ids.length) {
    return {} as Record<number, ResepDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase.from("resep_detail").select("*").in("resep_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<number, ResepDetail[]>>((acc, row) => {
    const detail = toDetail(row, lookupMaps.obatById);
    acc[detail.resepId] = [...(acc[detail.resepId] ?? []), detail];
    return acc;
  }, {});
}

async function resolvePelangganId(payload: ResepInput) {
  if (payload.pelangganId && payload.pelangganId > 0) {
    return payload.pelangganId;
  }

  const nama = payload.pelangganNama?.trim();

  if (!nama || !isSupabaseConfigured || !supabase) {
    return payload.pelangganId ?? 0;
  }

  const { data, error } = await supabase
    .from("pelanggan")
    .insert({
      nama,
      telepon: payload.pelangganTelepon ?? "",
      alamat: "",
      jenis_kelamin: ""
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as number;
}

export const resepService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterResep(localResep, params.search), params);
    }

    const [{ data, error }, lookupMaps] = await Promise.all([
      supabase.from("resep").select("*").order("created_at", { ascending: false }),
      loadLookupMaps()
    ]);

    if (error) {
      throw new Error(error.message);
    }

    const detailByResep = await loadDetailsForResep(
      (data ?? []).map((item) => item.id)
    );
    const rows = filterResep(
      (data ?? []).map((item) =>
        toResep(item, detailByResep[item.id] ?? [], lookupMaps.pelangganById)
      ),
      params.search
    );

    return paginate(rows, params);
  },

  async getById(id: number) {
    if (!isSupabaseConfigured || !supabase) {
      return localResep.find((item) => item.id === id) ?? null;
    }

    const [{ data, error }, lookupMaps, detailByResep] = await Promise.all([
      supabase.from("resep").select("*").eq("id", id).single(),
      loadLookupMaps(),
      loadDetailsForResep([id])
    ]);

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return data
      ? toResep(data, detailByResep[id] ?? [], lookupMaps.pelangganById)
      : null;
  },

  async create(payload: ResepInput): Promise<Resep> {
    const status = payload.status ?? "menunggu";
    const nomorResep =
      payload.nomorResep?.trim() ||
      generateNomorResep(new Date(payload.tanggalResep || Date.now()));
    const pelangganId = await resolvePelangganId(payload);

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const id = Date.now();
      const created: Resep = {
        id,
        nomorResep,
        pelangganId,
        namaPelanggan: payload.pelangganNama ?? "-",
        namaDokter: payload.namaDokter,
        noSipDokter: payload.noSipDokter,
        asalPuskesmas: payload.asalPuskesmas ?? "",
        tanggalResep: payload.tanggalResep,
        catatan: payload.catatan ?? "",
        status,
        createdBy: "",
        createdAt: now,
        updatedAt: now,
        details: payload.details.map((detail, index) => ({
          id: index + 1,
          resepId: id,
          obatId: detail.obatId,
          namaObat: "-",
          aturanPakai: detail.aturanPakai,
          jumlah: detail.jumlah,
          catatan: detail.catatan ?? ""
        }))
      };

      localResep.unshift(created);
      return created;
    }

    const { data, error } = await supabase
      .from("resep")
      .insert({
        nomor_resep: nomorResep,
        pelanggan_id: pelangganId || null,
        nama_dokter: payload.namaDokter,
        no_sip_dokter: payload.noSipDokter,
        asal_puskesmas: payload.asalPuskesmas ?? "",
        tanggal_resep: payload.tanggalResep || null,
        catatan: payload.catatan ?? "",
        status,
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.details.length) {
      const { error: detailError } = await supabase
        .from("resep_detail")
        .insert(
          payload.details.map((detail) => ({
            resep_id: data.id,
            obat_id: detail.obatId,
            aturan_pakai: detail.aturanPakai,
            jumlah: detail.jumlah,
            catatan: detail.catatan ?? ""
          }))
        );

      if (detailError) {
        throw new Error(detailError.message);
      }
    }

    const created = await this.getById(data.id);

    if (!created) {
      throw new Error("Resep berhasil dibuat, tetapi data tidak dapat dimuat ulang");
    }

    return created;
  },

  async updateStatus(id: number, status: StatusResep) {
    if (!isSupabaseConfigured || !supabase) {
      const index = localResep.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error("Resep tidak ditemukan");
      }

      localResep[index] = {
        ...localResep[index],
        status,
        updatedAt: new Date().toISOString()
      };

      return localResep[index];
    }

    const { error } = await supabase
      .from("resep")
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const updated = await this.getById(id);

    if (!updated) {
      throw new Error("Resep tidak ditemukan");
    }

    return updated;
  },

  async listPelangganOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("pelanggan")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  }
};
