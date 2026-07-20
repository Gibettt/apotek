import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Resep, ResepDetail, StatusResep } from "@/types";
import { getCurrentUserId, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface ResepDetailInput {
  barangId: string;
  satuanId?: string;
  aturanPakai?: string;
  instruksiRacikan?: string;
  racikan?: boolean;
  jumlah: number;
  catatan?: string;
}

export interface ResepInput {
  nomorResep?: string;
  pelangganId?: string;
  pelangganNama?: string;
  pelangganTelepon?: string;
  dokterId?: string;
  namaDokter: string;
  noSipDokter: string;
  asalPuskesmas?: string;
  tanggalResep: string;
  namaPasien?: string;
  umurPasien?: string;
  alamatPasien?: string;
  catatan?: string;
  status?: StatusResep;
  details: ResepDetailInput[];
}

export interface MasterOption {
  id: string;
  label: string;
}

interface ResepRow {
  id: string;
  penjualan_id: string | null;
  pelanggan_id: string | null;
  dokter_id: string | null;
  nomor_resep: string | null;
  tanggal_resep: string | null;
  nama_pasien: string | null;
  umur_pasien: string | null;
  alamat_pasien: string | null;
  catatan: string | null;
  status: StatusResep | null;
  dibuat_oleh: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ResepDetailRow {
  id: string;
  resep_id: string | null;
  barang_id: string | null;
  satuan_id: string | null;
  qty: number | null;
  aturan_pakai: string | null;
  instruksi_racikan: string | null;
  racikan: boolean | null;
  catatan: string | null;
}

interface DokterInfo {
  nama: string;
  nomorSip?: string;
}

const localResep: Resep[] = [];

function generateNomorResep(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-5);
  return `RSP-${stamp}-${suffix}`;
}

function buildCatatan(payload: ResepInput) {
  const parts = [
    payload.catatan?.trim(),
    payload.asalPuskesmas?.trim() ? `Asal: ${payload.asalPuskesmas.trim()}` : ""
  ].filter(Boolean);

  return parts.join(" | ");
}

function toDetail(
  row: ResepDetailRow,
  obatById: Record<string, string> = {}
): ResepDetail {
  const barangId = row.barang_id ?? undefined;

  return {
    id: row.id,
    resepId: row.resep_id ?? "",
    barangId,
    namaBarang: barangId ? obatById[barangId] ?? "-" : undefined,
    satuanId: row.satuan_id ?? undefined,
    jumlah: Number(row.qty ?? 0),
    aturanPakai: row.aturan_pakai ?? undefined,
    instruksiRacikan: row.instruksi_racikan ?? undefined,
    racikan: row.racikan ?? false,
    catatan: row.catatan ?? undefined
  };
}

function toResep(
  row: ResepRow,
  details: ResepDetail[] = [],
  pelangganById: Record<string, string> = {},
  dokterById: Record<string, DokterInfo> = {}
): Resep {
  const pelangganId = row.pelanggan_id ?? undefined;
  const dokterId = row.dokter_id ?? undefined;
  const dokter = dokterId ? dokterById[dokterId] : undefined;

  return {
    id: row.id,
    nomorResep: row.nomor_resep ?? undefined,
    pelangganId,
    namaPelanggan: pelangganId ? pelangganById[pelangganId] ?? "-" : "-",
    penjualanId: row.penjualan_id ?? undefined,
    dokterId,
    namaDokter: dokter?.nama ?? "",
    noSipDokter: dokter?.nomorSip ?? "",
    asalPuskesmas: "",
    tanggalResep: row.tanggal_resep ?? "",
    namaPasien: row.nama_pasien ?? undefined,
    umurPasien: row.umur_pasien ?? undefined,
    alamatPasien: row.alamat_pasien ?? undefined,
    catatan: row.catatan ?? "",
    status: row.status ?? "menunggu",
    createdBy: row.dibuat_oleh ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    details
  };
}

function filterResep(rows: Resep[], search?: string) {
  return matchSearch(rows, search, ["nomorResep", "namaPelanggan", "namaDokter", "status"]);
}

async function loadLookupMaps() {
  if (!supabase) {
    return {
      pelangganById: {} as Record<string, string>,
      obatById: {} as Record<string, string>,
      dokterById: {} as Record<string, DokterInfo>
    };
  }

  const [pelangganResult, obatResult, dokterResult] = await Promise.all([
    supabase.from("pelanggan").select("id,nama"),
    supabase.from("barang").select("id,nama"),
    supabase.from("dokter").select("id,nama,nomor_sip")
  ]);

  if (pelangganResult.error) {
    throw new Error(pelangganResult.error.message);
  }

  if (obatResult.error) {
    throw new Error(obatResult.error.message);
  }

  if (dokterResult.error) {
    throw new Error(dokterResult.error.message);
  }

  return {
    pelangganById: Object.fromEntries(
      (pelangganResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    obatById: Object.fromEntries(
      (obatResult.data ?? []).map((item) => [item.id, item.nama])
    ),
    dokterById: Object.fromEntries(
      (dokterResult.data ?? []).map((item) => [
        item.id,
        { nama: item.nama, nomorSip: item.nomor_sip ?? undefined }
      ])
    )
  };
}

async function loadDetailsForResep(ids: string[]) {
  if (!supabase || !ids.length) {
    return {} as Record<string, ResepDetail[]>;
  }

  const [{ data, error }, lookupMaps] = await Promise.all([
    supabase.from("resep_detail").select("*").in("resep_id", ids),
    loadLookupMaps()
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, ResepDetail[]>>((acc, row) => {
    const detail = toDetail(row, lookupMaps.obatById);
    acc[detail.resepId] = [...(acc[detail.resepId] ?? []), detail];
    return acc;
  }, {});
}

async function resolvePelangganId(payload: ResepInput) {
  if (payload.pelangganId) {
    return payload.pelangganId;
  }

  const nama = payload.pelangganNama?.trim();

  if (!nama || !isSupabaseConfigured || !supabase) {
    return payload.pelangganId;
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

  return data.id as string;
}

async function resolveDokterId(payload: ResepInput) {
  if (payload.dokterId) {
    return payload.dokterId;
  }

  const nama = payload.namaDokter?.trim();

  if (!nama || !isSupabaseConfigured || !supabase) {
    return payload.dokterId;
  }

  const { data, error } = await supabase
    .from("dokter")
    .insert({
      kode: `DOK-${Date.now()}`,
      nama,
      nomor_sip: payload.noSipDokter ?? ""
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
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

    const detailByResep = await loadDetailsForResep((data ?? []).map((item) => item.id));
    const rows = filterResep(
      (data ?? []).map((item) =>
        toResep(item, detailByResep[item.id] ?? [], lookupMaps.pelangganById, lookupMaps.dokterById)
      ),
      params.search
    );

    return paginate(rows, params);
  },

  async getById(id: string) {
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
      ? toResep(data, detailByResep[id] ?? [], lookupMaps.pelangganById, lookupMaps.dokterById)
      : null;
  },

  async create(payload: ResepInput): Promise<Resep> {
    const status = payload.status ?? "menunggu";
    const nomorResep =
      payload.nomorResep?.trim() ||
      generateNomorResep(new Date(payload.tanggalResep || Date.now()));
    const pelangganId = await resolvePelangganId(payload);
    const dokterId = await resolveDokterId(payload);
    const catatan = buildCatatan(payload);

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const created: Resep = {
        id,
        nomorResep,
        pelangganId,
        namaPelanggan: payload.pelangganNama ?? "-",
        dokterId,
        namaDokter: payload.namaDokter,
        noSipDokter: payload.noSipDokter,
        asalPuskesmas: payload.asalPuskesmas ?? "",
        tanggalResep: payload.tanggalResep,
        namaPasien: payload.namaPasien,
        umurPasien: payload.umurPasien,
        alamatPasien: payload.alamatPasien,
        catatan,
        status,
        createdBy: "",
        createdAt: now,
        updatedAt: now,
        details: payload.details.map((detail) => ({
          id: crypto.randomUUID(),
          resepId: id,
          barangId: detail.barangId,
          namaBarang: "-",
          satuanId: detail.satuanId,
          aturanPakai: detail.aturanPakai,
          instruksiRacikan: detail.instruksiRacikan,
          racikan: detail.racikan ?? false,
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
        dokter_id: dokterId || null,
        tanggal_resep: payload.tanggalResep || null,
        nama_pasien: payload.namaPasien ?? null,
        umur_pasien: payload.umurPasien ?? null,
        alamat_pasien: payload.alamatPasien ?? null,
        catatan,
        status,
        dibuat_oleh: getCurrentUserId(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (payload.details.length) {
      const { error: detailError } = await supabase.from("resep_detail").insert(
        payload.details.map((detail) => ({
          resep_id: data.id,
          barang_id: detail.barangId,
          satuan_id: detail.satuanId ?? null,
          qty: detail.jumlah,
          aturan_pakai: detail.aturanPakai ?? null,
          instruksi_racikan: detail.instruksiRacikan ?? null,
          racikan: detail.racikan ?? false,
          catatan: detail.catatan ?? null
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

  async updateStatus(id: string, status: StatusResep) {
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
  },

  async listDokterOptions(): Promise<MasterOption[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("dokter")
      .select("id,nama")
      .order("nama", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({ id: item.id, label: item.nama }));
  }
};
