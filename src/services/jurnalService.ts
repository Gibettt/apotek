import { defaultCabangId } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { computeJurnalTotals, validateJurnalLines } from "@/lib/jurnalValidation";
import type { JurnalDetail, JurnalInput, JurnalUmum, StatusJurnal } from "@/types";
import { getCurrentUserId, matchSearch, paginate, type ListParams } from "./serviceUtils";

export interface JurnalListParams extends ListParams {
  startDate?: string;
  endDate?: string;
  status?: StatusJurnal | "semua";
}

interface JurnalUmumRow {
  id: string;
  cabang_id: string | null;
  nomor: string;
  tanggal: string;
  nomor_referensi: string | null;
  sumber: string;
  sumber_tabel: string | null;
  sumber_id: string | null;
  deskripsi: string | null;
  status: string;
  dibuat_oleh: string | null;
  posted_at: string | null;
  posted_by: string | null;
  created_at: string;
  updated_at: string;
}

interface JurnalUmumDetailRow {
  id: string;
  jurnal_umum_id: string;
  akun_id: string;
  debit: number | string | null;
  kredit: number | string | null;
  keterangan: string | null;
}

interface AkunLookup {
  kode: string;
  nama: string;
  tipe: string;
  aktif: boolean;
}

const localJurnal: JurnalUmum[] = [];

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
    .select("id,kode,nama,tipe,aktif")
    .in("id", [...new Set(akunIds)]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, AkunLookup>>((acc, row) => {
    acc[row.id] = {
      kode: row.kode,
      nama: row.nama,
      tipe: row.tipe,
      aktif: row.aktif ?? true
    };
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

async function loadDetailsForJurnal(jurnalIds: string[]) {
  if (!supabase || !jurnalIds.length) {
    return {} as Record<string, JurnalUmumDetailRow[]>;
  }

  const { data, error } = await supabase
    .from("jurnal_umum_detail")
    .select("id,jurnal_umum_id,akun_id,debit,kredit,keterangan")
    .in("jurnal_umum_id", jurnalIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<Record<string, JurnalUmumDetailRow[]>>((acc, row) => {
    acc[row.jurnal_umum_id] = [...(acc[row.jurnal_umum_id] ?? []), row];
    return acc;
  }, {});
}

function toJurnal(
  row: JurnalUmumRow,
  detailRows: JurnalUmumDetailRow[],
  akunById: Record<string, AkunLookup>,
  penggunaById: Record<string, string>
): JurnalUmum {
  const details: JurnalDetail[] = detailRows.map((detail) => {
    const akun = akunById[detail.akun_id];
    return {
      id: detail.id,
      akunId: detail.akun_id,
      kodeAkun: akun?.kode ?? "-",
      namaAkun: akun?.nama ?? "-",
      tipeAkun: akun?.tipe ?? "-",
      debit: toNumber(detail.debit),
      kredit: toNumber(detail.kredit),
      keterangan: detail.keterangan ?? undefined
    };
  });

  const totals = computeJurnalTotals(details);

  return {
    id: row.id,
    cabangId: row.cabang_id ?? undefined,
    nomor: row.nomor,
    tanggal: row.tanggal,
    nomorReferensi: row.nomor_referensi ?? undefined,
    sumber: row.sumber,
    sumberTabel: row.sumber_tabel ?? undefined,
    sumberId: row.sumber_id ?? undefined,
    deskripsi: row.deskripsi ?? "",
    status: (row.status as StatusJurnal) ?? "draft",
    dibuatOleh: row.dibuat_oleh ?? undefined,
    namaDibuatOleh: row.dibuat_oleh ? penggunaById[row.dibuat_oleh] : undefined,
    postedAt: row.posted_at ?? undefined,
    postedBy: row.posted_by ?? undefined,
    namaPostedBy: row.posted_by ? penggunaById[row.posted_by] : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    details,
    totalDebit: totals.totalDebit,
    totalKredit: totals.totalKredit
  };
}

function searchBlob(item: JurnalUmum) {
  return [
    item.nomor,
    item.deskripsi,
    item.nomorReferensi ?? "",
    ...item.details.map((detail) => `${detail.kodeAkun} ${detail.namaAkun}`)
  ]
    .join(" ")
    .toLowerCase();
}

function filterJurnal(rows: JurnalUmum[], search?: string) {
  if (!search) {
    return rows;
  }

  const withBlob = rows.map((row) => ({ ...row, __blob: searchBlob(row) }));
  return matchSearch(withBlob, search, ["__blob"] as Array<keyof (typeof withBlob)[number]>);
}

function toDetailPayload(details: JurnalInput["details"]) {
  return details.map((detail) => ({
    akunId: detail.akunId,
    debit: detail.debit,
    kredit: detail.kredit,
    keterangan: detail.keterangan ?? null
  }));
}

function assertPayloadValid(payload: JurnalInput, requireBalanced: boolean) {
  const errors = validateJurnalLines(
    payload.details.map((detail) => ({
      akunId: detail.akunId,
      debit: detail.debit,
      kredit: detail.kredit
    })),
    requireBalanced
  );

  if (errors.length) {
    throw new Error(errors[0]);
  }
}

export const jurnalService = {
  async list(params: JurnalListParams = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return paginate(filterJurnal([...localJurnal], params.search), params);
    }

    let query = supabase
      .from("jurnal_umum")
      .select("*")
      .order("tanggal", { ascending: false })
      .order("nomor", { ascending: false });

    if (params.startDate) {
      query = query.gte("tanggal", params.startDate);
    }
    if (params.endDate) {
      query = query.lte("tanggal", params.endDate);
    }
    if (params.status && params.status !== "semua") {
      query = query.eq("status", params.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const headers = (data ?? []) as JurnalUmumRow[];
    const detailByJurnal = await loadDetailsForJurnal(headers.map((row) => row.id));
    const allDetails = Object.values(detailByJurnal).flat();
    const akunById = await loadAkunMap(allDetails.map((detail) => detail.akun_id));
    const penggunaById = await loadPenggunaMap(
      headers.flatMap((row) => [row.dibuat_oleh, row.posted_by]).filter((id): id is string => Boolean(id))
    );

    const rows = headers.map((row) =>
      toJurnal(row, detailByJurnal[row.id] ?? [], akunById, penggunaById)
    );

    return paginate(filterJurnal(rows, params.search), params);
  },

  async getById(id: string): Promise<JurnalUmum | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localJurnal.find((item) => item.id === id) ?? null;
    }

    const { data, error } = await supabase
      .from("jurnal_umum")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if ("code" in error && error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    const row = data as JurnalUmumRow;
    const detailByJurnal = await loadDetailsForJurnal([row.id]);
    const detailRows = detailByJurnal[row.id] ?? [];
    const [akunById, penggunaById] = await Promise.all([
      loadAkunMap(detailRows.map((detail) => detail.akun_id)),
      loadPenggunaMap([row.dibuat_oleh, row.posted_by].filter((v): v is string => Boolean(v)))
    ]);

    return toJurnal(row, detailRows, akunById, penggunaById);
  },

  async create(payload: JurnalInput): Promise<string> {
    assertPayloadValid(payload, payload.status === "diposting");

    if (!isSupabaseConfigured || !supabase) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const status = payload.status ?? "draft";
      const details: JurnalDetail[] = payload.details.map((detail) => ({
        id: crypto.randomUUID(),
        akunId: detail.akunId,
        kodeAkun: "-",
        namaAkun: "-",
        tipeAkun: "-",
        debit: detail.debit,
        kredit: detail.kredit,
        keterangan: detail.keterangan
      }));
      const totals = computeJurnalTotals(details);

      localJurnal.unshift({
        id,
        cabangId: payload.cabangId ?? defaultCabangId,
        nomor: `JU-${now.slice(0, 7).replace("-", "")}-${String(localJurnal.length + 1).padStart(4, "0")}`,
        tanggal: payload.tanggal,
        nomorReferensi: payload.nomorReferensi,
        sumber: "manual",
        deskripsi: payload.deskripsi,
        status,
        dibuatOleh: getCurrentUserId() ?? undefined,
        postedAt: status === "diposting" ? now : undefined,
        createdAt: now,
        updatedAt: now,
        details,
        totalDebit: totals.totalDebit,
        totalKredit: totals.totalKredit
      });

      return id;
    }

    const cabangId = await resolveCabangId(payload.cabangId);

    const { data, error } = await supabase.rpc("create_jurnal_umum", {
      p_tanggal: payload.tanggal,
      p_nomor_referensi: payload.nomorReferensi ?? null,
      p_deskripsi: payload.deskripsi,
      p_status: payload.status ?? "draft",
      p_cabang_id: cabangId ?? null,
      p_sumber: "manual",
      p_sumber_tabel: null,
      p_sumber_id: null,
      p_details: toDetailPayload(payload.details)
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as string;
  },

  async updateDraft(id: string, payload: JurnalInput): Promise<void> {
    assertPayloadValid(payload, false);

    if (!isSupabaseConfigured || !supabase) {
      const index = localJurnal.findIndex((item) => item.id === id);
      if (index >= 0) {
        const details: JurnalDetail[] = payload.details.map((detail) => ({
          id: crypto.randomUUID(),
          akunId: detail.akunId,
          kodeAkun: "-",
          namaAkun: "-",
          tipeAkun: "-",
          debit: detail.debit,
          kredit: detail.kredit,
          keterangan: detail.keterangan
        }));
        const totals = computeJurnalTotals(details);
        localJurnal[index] = {
          ...localJurnal[index],
          tanggal: payload.tanggal,
          nomorReferensi: payload.nomorReferensi,
          deskripsi: payload.deskripsi,
          details,
          totalDebit: totals.totalDebit,
          totalKredit: totals.totalKredit,
          updatedAt: new Date().toISOString()
        };
      }
      return;
    }

    const { error } = await supabase.rpc("update_jurnal_umum_draft", {
      p_id: id,
      p_tanggal: payload.tanggal,
      p_nomor_referensi: payload.nomorReferensi ?? null,
      p_deskripsi: payload.deskripsi,
      p_details: toDetailPayload(payload.details)
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async post(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localJurnal.findIndex((item) => item.id === id);
      if (index >= 0) {
        const item = localJurnal[index];
        if (!computeJurnalTotals(item.details).seimbang) {
          throw new Error("Jurnal belum seimbang, tidak dapat diposting");
        }
        localJurnal[index] = {
          ...item,
          status: "diposting",
          postedAt: new Date().toISOString()
        };
      }
      return;
    }

    const { error } = await supabase.rpc("post_jurnal_umum", { p_id: id });

    if (error) {
      throw new Error(error.message);
    }
  },

  async deleteDraft(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localJurnal.findIndex((item) => item.id === id);
      if (index >= 0) {
        localJurnal.splice(index, 1);
      }
      return;
    }

    const { error } = await supabase.rpc("delete_jurnal_umum_draft", { p_id: id });

    if (error) {
      throw new Error(error.message);
    }
  },

  async reverse(id: string, alasan?: string): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localJurnal.findIndex((item) => item.id === id);
      if (index >= 0) {
        localJurnal[index] = { ...localJurnal[index], status: "dibatalkan" };
      }
      return crypto.randomUUID();
    }

    const { data, error } = await supabase.rpc("reverse_jurnal_umum", {
      p_id: id,
      p_alasan: alasan ?? null
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as string;
  }
};
