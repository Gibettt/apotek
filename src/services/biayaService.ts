import { defaultCabangId } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface BiayaOperasional {
  id: string;
  cabangId?: string;
  akunId: string;
  kodeAkun: string;
  namaAkun: string;
  nomor: string;
  tanggal: string;
  namaBiaya: string;
  jumlah: number;
  metodeBayar: string;
  catatan?: string;
  dibuatOleh?: string;
  namaDibuatOleh?: string;
  dibatalkanAt?: string;
  dibatalkanOleh?: string;
  namaDibatalkanOleh?: string;
  jurnalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BiayaOperasionalInput {
  tanggal: string;
  akunId: string;
  namaBiaya: string;
  jumlah: number;
  metodeBayar: "tunai" | "transfer";
  catatan?: string;
  cabangId?: string;
}

interface BiayaRow {
  id: string;
  cabang_id: string | null;
  akun_id: string | null;
  nomor: string;
  tanggal: string;
  nama_biaya: string;
  jumlah: number | string | null;
  metode_bayar: string | null;
  catatan: string | null;
  dibuat_oleh: string | null;
  dibatalkan_at: string | null;
  dibatalkan_oleh: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AkunLookup {
  kode: string;
  nama: string;
}

const localBiayaList: BiayaOperasional[] = [];

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

async function resolveCabangId(preferred?: string): Promise<string | undefined> {
  if (!isSupabaseConfigured || !supabase) {
    return preferred || defaultCabangId;
  }

  if (preferred) {
    return preferred;
  }

  const { data } = await supabase
    .from("cabang")
    .select("id")
    .eq("aktif", true)
    .order("nama", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id as string | undefined;
}

async function loadAkunMap(akunIds: string[]) {
  if (!supabase || !akunIds.length) {
    return {} as Record<string, AkunLookup>;
  }

  const { data, error } = await supabase
    .from("akun")
    .select("id,kode,nama")
    .in("id", [...new Set(akunIds)]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, AkunLookup>>((acc, row) => {
    acc[row.id] = { kode: row.kode, nama: row.nama };
    return acc;
  }, {});
}

async function loadPenggunaMap(penggunaIds: string[]) {
  if (!supabase || !penggunaIds.length) {
    return {} as Record<string, string>;
  }

  const { data, error } = await supabase
    .from("pengguna")
    .select("id,nama_lengkap")
    .in("id", [...new Set(penggunaIds)]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, string>>((acc, row) => {
    acc[row.id] = row.nama_lengkap;
    return acc;
  }, {});
}

async function loadJurnalIdMap(biayaIds: string[]) {
  if (!supabase || !biayaIds.length) {
    return {} as Record<string, string>;
  }

  const { data, error } = await supabase
    .from("jurnal_umum")
    .select("id,sumber_id")
    .eq("sumber_tabel", "biaya_operasional")
    .in("sumber_id", biayaIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, string>>((acc, row) => {
    if (row.sumber_id) {
      acc[row.sumber_id] = row.id;
    }
    return acc;
  }, {});
}

function toBiayaOperasional(
  row: BiayaRow,
  akunById: Record<string, AkunLookup>,
  penggunaById: Record<string, string>,
  jurnalById: Record<string, string>
): BiayaOperasional {
  const akun = row.akun_id ? akunById[row.akun_id] : undefined;

  return {
    id: row.id,
    cabangId: row.cabang_id ?? undefined,
    akunId: row.akun_id ?? "",
    kodeAkun: akun?.kode ?? "-",
    namaAkun: akun?.nama ?? "-",
    nomor: row.nomor,
    tanggal: row.tanggal,
    namaBiaya: row.nama_biaya,
    jumlah: toNumber(row.jumlah),
    metodeBayar: row.metode_bayar ?? "tunai",
    catatan: row.catatan ?? undefined,
    dibuatOleh: row.dibuat_oleh ?? undefined,
    namaDibuatOleh: row.dibuat_oleh ? penggunaById[row.dibuat_oleh] : undefined,
    dibatalkanAt: row.dibatalkan_at ?? undefined,
    dibatalkanOleh: row.dibatalkan_oleh ?? undefined,
    namaDibatalkanOleh: row.dibatalkan_oleh ? penggunaById[row.dibatalkan_oleh] : undefined,
    jurnalId: jurnalById[row.id],
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
  };
}

function filterBiaya(rows: BiayaOperasional[], search?: string) {
  return matchSearch(rows, search, ["nomor", "namaBiaya", "namaAkun", "catatan"]);
}

export const biayaService = {
  async list(params: ListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(paginate(filterBiaya([...localBiayaList], params.search), params));
    }

    const { data, error } = await supabase
      .from("biaya_operasional")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as BiayaRow[];
    const [akunById, penggunaById, jurnalById] = await Promise.all([
      loadAkunMap(rows.map((row) => row.akun_id).filter((id): id is string => Boolean(id))),
      loadPenggunaMap(
        rows.flatMap((row) => [row.dibuat_oleh, row.dibatalkan_oleh]).filter((id): id is string => Boolean(id))
      ),
      loadJurnalIdMap(rows.map((row) => row.id))
    ]);

    const mapped = filterBiaya(
      rows.map((row) => toBiayaOperasional(row, akunById, penggunaById, jurnalById)),
      params.search
    );

    return paginate(mapped, params);
  },

  async getById(id: string): Promise<BiayaOperasional | null> {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localBiayaList.find((item) => item.id === id) ?? null);
    }

    const { data, error } = await supabase
      .from("biaya_operasional")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    const row = data as BiayaRow;
    const [akunById, penggunaById, jurnalById] = await Promise.all([
      loadAkunMap(row.akun_id ? [row.akun_id] : []),
      loadPenggunaMap([row.dibuat_oleh, row.dibatalkan_oleh].filter((v): v is string => Boolean(v))),
      loadJurnalIdMap([row.id])
    ]);

    return toBiayaOperasional(row, akunById, penggunaById, jurnalById);
  },

  async create(payload: BiayaOperasionalInput): Promise<string> {
    if (payload.jumlah <= 0) {
      throw new Error("Jumlah biaya harus lebih besar dari nol");
    }
    if (!payload.akunId) {
      throw new Error("Akun beban wajib dipilih");
    }
    if (!payload.namaBiaya.trim()) {
      throw new Error("Nama biaya wajib diisi");
    }

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      localBiayaList.unshift({
        id,
        cabangId: payload.cabangId ?? defaultCabangId,
        akunId: payload.akunId,
        kodeAkun: "-",
        namaAkun: "-",
        nomor: `BOP-${now.slice(0, 7).replace("-", "")}-${String(localBiayaList.length + 1).padStart(4, "0")}`,
        tanggal: payload.tanggal,
        namaBiaya: payload.namaBiaya,
        jumlah: payload.jumlah,
        metodeBayar: payload.metodeBayar,
        catatan: payload.catatan,
        createdAt: now,
        updatedAt: now
      });
      return id;
    }

    const cabangId = await resolveCabangId(payload.cabangId);

    const { data, error } = await supabase.rpc("create_biaya_operasional", {
      p_tanggal: payload.tanggal,
      p_akun_id: payload.akunId,
      p_nama_biaya: payload.namaBiaya.trim(),
      p_jumlah: payload.jumlah,
      p_metode_bayar: payload.metodeBayar,
      p_catatan: payload.catatan ?? null,
      p_cabang_id: cabangId ?? null
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as string;
  },

  async void(id: string, alasan?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localBiayaList.findIndex((item) => item.id === id);
      if (index >= 0) {
        localBiayaList[index] = { ...localBiayaList[index], dibatalkanAt: new Date().toISOString() };
      }
      return;
    }

    const { error } = await supabase.rpc("void_biaya_operasional", {
      p_id: id,
      p_alasan: alasan ?? null
    });

    if (error) {
      throw new Error(error.message);
    }
  }
};
