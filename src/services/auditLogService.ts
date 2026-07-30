import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { pembelianService } from "@/services/pembelianService";
import { penjualanService } from "@/services/penjualanService";
import { returPembelianService } from "@/services/returPembelianService";
import { returPenjualanService } from "@/services/returPenjualanService";
import { matchSearch, paginate, type ListParams } from "./serviceUtils";

export type AuditAction = "INSERT" | "UPDATE" | "DELETE" | "POST" | "CANCEL";

export interface AuditLog {
  id: string;
  waktu: string;
  aksi: AuditAction;
  namaTabel: string;
  recordId?: string;
  deskripsi?: string;
  pengguna: string;
  penggunaEmail?: string;
}

interface AuditLogInput {
  aksi: AuditAction;
  namaTabel: string;
  recordId?: string;
  deskripsi?: string;
}

interface AuditLogRow {
  id: string;
  waktu: string | null;
  aksi: AuditAction | string | null;
  nama_tabel: string | null;
  record_id: string | null;
  deskripsi: string | null;
  pengguna_nama: string | null;
  pengguna_email?: string | null;
  created_at?: string | null;
}

interface PenggunaAuditRow {
  id: string;
  nama_lengkap: string | null;
  email: string | null;
}

interface AuditActor {
  nama: string;
  email?: string;
}

const localAuditStorageKey = "apotek-audit-log";
const LOAD_ALL = { perPage: 9999 };

function isMissingAuditTable(error: { message?: string; code?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.message?.includes("audit_log") ||
    error?.message?.includes("schema cache")
  );
}

function currentActor() {
  if (typeof window === "undefined") {
    return { nama: "Sistem", email: undefined as string | undefined };
  }

  const user = useAuthStore.getState().user;

  return {
    nama: user?.name ?? "Sistem",
    email: user?.email
  };
}

async function loadActorMap(createdByIds: Array<string | undefined>) {
  const ids = [...new Set(createdByIds.filter((id): id is string => Boolean(id)))];

  if (!isSupabaseConfigured || !supabase || !ids.length) {
    return {} as Record<string, AuditActor>;
  }

  const { data, error } = await supabase
    .from("pengguna")
    .select("id,nama_lengkap,email")
    .in("id", ids);

  if (error) {
    return {} as Record<string, AuditActor>;
  }

  return ((data ?? []) as PenggunaAuditRow[]).reduce<Record<string, AuditActor>>(
    (acc, row) => {
      acc[row.id] = {
        nama: row.nama_lengkap || row.email || row.id,
        email: row.email ?? undefined
      };
      return acc;
    },
    {}
  );
}

function actorFromCreatedBy(
  createdBy?: string,
  actorById: Record<string, AuditActor> = {}
) {
  if (createdBy && actorById[createdBy]) {
    return actorById[createdBy];
  }

  if (typeof window !== "undefined") {
    const user = useAuthStore.getState().user;
    if (user?.id && createdBy === user.id) {
      return { nama: user.name, email: user.email };
    }
  }

  return { nama: createdBy || "Sistem", email: undefined as string | undefined };
}

function readLocalAuditLogs() {
  if (typeof window === "undefined") return [] as AuditLog[];

  try {
    const stored = window.localStorage.getItem(localAuditStorageKey);
    return stored ? (JSON.parse(stored) as AuditLog[]) : [];
  } catch {
    window.localStorage.removeItem(localAuditStorageKey);
    return [];
  }
}

function writeLocalAuditLogs(rows: AuditLog[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    localAuditStorageKey,
    JSON.stringify(rows.slice(0, 500))
  );
}

function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    waktu: row.waktu ?? row.created_at ?? "",
    aksi: (row.aksi ?? "UPDATE") as AuditAction,
    namaTabel: row.nama_tabel ?? "-",
    recordId: row.record_id ?? undefined,
    deskripsi: row.deskripsi ?? undefined,
    pengguna: row.pengguna_nama ?? "Sistem",
    penggunaEmail: row.pengguna_email ?? undefined
  };
}

function deriveId(source: string, id: string) {
  return `derived-${source}-${id}`;
}

async function loadRemoteAuditLogs() {
  if (!isSupabaseConfigured || !supabase) return [] as AuditLog[];

  const { data, error } = await supabase
    .from("audit_log")
    .select("id,waktu,aksi,nama_tabel,record_id,deskripsi,pengguna_nama,pengguna_email,created_at")
    .order("waktu", { ascending: false })
    .limit(500);

  if (error) {
    if (isMissingAuditTable(error)) return [];
    return [];
  }

  return ((data ?? []) as AuditLogRow[]).map(toAuditLog);
}

async function loadDerivedAuditLogs() {
  const [penjualan, pembelian, returPenjualan, returPembelian] =
    await Promise.all([
      penjualanService.list(LOAD_ALL).catch(() => null),
      pembelianService.list(LOAD_ALL).catch(() => null),
      returPenjualanService.list(LOAD_ALL).catch(() => null),
      returPembelianService.list(LOAD_ALL).catch(() => null)
    ]);
  const actorById = await loadActorMap([
    ...(penjualan?.data ?? []).map((item) => item.createdBy),
    ...(pembelian?.data ?? []).map((item) => item.createdBy),
    ...(returPenjualan?.data ?? []).map((item) => item.createdBy),
    ...(returPembelian?.data ?? []).map((item) => item.createdBy)
  ]);

  return [
    ...(penjualan?.data ?? []).map<AuditLog>((item) => {
      const actor = actorFromCreatedBy(item.createdBy, actorById);
      return {
        id: deriveId("penjualan", item.id),
        waktu: item.createdAt || item.tanggal,
        aksi: item.status === "dibatalkan" ? "CANCEL" : "INSERT",
        namaTabel: "penjualan",
        recordId: item.id,
        deskripsi: `${item.nomorInvoice} - ${item.namaPelanggan}`,
        pengguna: actor.nama,
        penggunaEmail: actor.email
      };
    }),
    ...(pembelian?.data ?? []).map<AuditLog>((item) => {
      const actor = actorFromCreatedBy(item.createdBy, actorById);
      return {
        id: deriveId("pembelian", item.id),
        waktu: item.createdAt || item.tanggalFaktur,
        aksi: item.status === "dibatalkan" ? "CANCEL" : "INSERT",
        namaTabel: "pembelian",
        recordId: item.id,
        deskripsi: `${item.nomorInternal} - ${item.namaSupplier}`,
        pengguna: actor.nama,
        penggunaEmail: actor.email
      };
    }),
    ...(returPenjualan?.data ?? []).map<AuditLog>((item) => {
      const actor = actorFromCreatedBy(item.createdBy, actorById);
      return {
        id: deriveId("retur-penjualan", item.id),
        waktu: item.createdAt || item.tanggal,
        aksi: item.status === "dibatalkan" ? "CANCEL" : "POST",
        namaTabel: "retur_penjualan",
        recordId: item.id,
        deskripsi: `${item.nomor} - ${item.namaPelanggan}`,
        pengguna: actor.nama,
        penggunaEmail: actor.email
      };
    }),
    ...(returPembelian?.data ?? []).map<AuditLog>((item) => {
      const actor = actorFromCreatedBy(item.createdBy, actorById);
      return {
        id: deriveId("retur-pembelian", item.id),
        waktu: item.createdAt || item.tanggal,
        aksi: item.status === "dibatalkan" ? "CANCEL" : "POST",
        namaTabel: "retur_pembelian",
        recordId: item.id,
        deskripsi: `${item.nomor} - ${item.namaSupplier}`,
        pengguna: actor.nama,
        penggunaEmail: actor.email
      };
    })
  ].filter((item) => item.waktu);
}

function mergeAuditLogs(rows: AuditLog[]) {
  const byId = rows.reduce<Record<string, AuditLog>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});

  return Object.values(byId).sort(
    (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
  );
}

function filterAudit(rows: AuditLog[], search?: string) {
  return matchSearch(rows, search, [
    "aksi",
    "namaTabel",
    "recordId",
    "deskripsi",
    "pengguna",
    "penggunaEmail"
  ]);
}

export const auditLogService = {
  async list(params: ListParams = {}) {
    const rows = mergeAuditLogs([
      ...readLocalAuditLogs(),
      ...(await loadRemoteAuditLogs()),
      ...(await loadDerivedAuditLogs())
    ]);

    return paginate(filterAudit(rows, params.search), params);
  },

  async record(input: AuditLogInput) {
    if (input.namaTabel === "audit_log") return;

    const actor = currentActor();
    const row: AuditLog = {
      id: crypto.randomUUID(),
      waktu: new Date().toISOString(),
      aksi: input.aksi,
      namaTabel: input.namaTabel,
      recordId: input.recordId,
      deskripsi: input.deskripsi,
      pengguna: actor.nama,
      penggunaEmail: actor.email
    };

    writeLocalAuditLogs([row, ...readLocalAuditLogs()]);

    if (!isSupabaseConfigured || !supabase) return row;

    const { error } = await supabase.from("audit_log").insert({
      id: row.id,
      waktu: row.waktu,
      aksi: row.aksi,
      nama_tabel: row.namaTabel,
      record_id: row.recordId ?? null,
      deskripsi: row.deskripsi ?? null,
      pengguna_nama: row.pengguna,
      pengguna_email: row.penggunaEmail ?? null
    });

    if (error && !isMissingAuditTable(error)) {
      return row;
    }

    return row;
  }
};
