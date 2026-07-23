"use client";

import Link from "next/link";
import {
  BadgeCheck,
  BookText,
  Clock3,
  Eye,
  FileMinus2,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { jurnalService } from "@/services/jurnalService";
import type { JurnalUmum, StatusJurnal } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 8;

const statusMeta: Record<
  StatusJurnal,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  draft: { label: "Draft", variant: "warning" },
  diposting: { label: "Diposting", variant: "success" },
  dibatalkan: { label: "Dibatalkan", variant: "danger" }
};

function JurnalStat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg bg-[#f8f7f3] p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#0f766e] shadow-sm">
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div>
          <p className="text-2xl font-black leading-none text-[#20201d]">{value}</p>
          <p className="mt-1 text-xs font-bold text-stone-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

type PendingAction = { type: "post" | "delete"; item: JurnalUmum } | null;

export function JurnalListPage() {
  const { allowed: canManage } = useRoleGuard(["owner", "admin"]);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<StatusJurnal | "semua">("semua");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [rows, setRows] = useState<JurnalUmum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState<PendingAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const result = await jurnalService.list({
        search,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        perPage: 9999
      });
      setRows(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data jurnal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      setIsLoading(true);
      try {
        const result = await jurnalService.list({
          search,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status,
          perPage: 9999
        });
        if (active) {
          setRows(result.data);
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Gagal memuat data jurnal");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startDate, endDate, status]);

  const stats = useMemo(() => {
    return {
      jumlahTransaksi: rows.length,
      totalDebit: rows.reduce((sum, row) => sum + row.totalDebit, 0),
      totalKredit: rows.reduce((sum, row) => sum + row.totalKredit, 0),
      jumlahDraft: rows.filter((row) => row.status === "draft").length
    };
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setStatus("semua");
    setPage(1);
  }

  async function handleConfirm() {
    if (!pending) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (pending.type === "post") {
        await jurnalService.post(pending.item.id);
        toast.success(`${pending.item.nomor} berhasil diposting`);
      } else {
        await jurnalService.deleteDraft(pending.item.id);
        toast.success(`${pending.item.nomor} berhasil dihapus`);
      }
      setPending(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aksi gagal dijalankan");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Jurnal Umum"
        description="Pencatatan seluruh transaksi keuangan berdasarkan debit dan kredit."
        action={
          canManage ? (
            <Link
              href="/jurnal/tambah"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
            >
              <Plus className="h-4 w-4" />
              Tambah Jurnal
            </Link>
          ) : null
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <div className="grid gap-3 md:grid-cols-4">
          <JurnalStat label="Jumlah Transaksi" value={stats.jumlahTransaksi} icon={BookText} />
          <JurnalStat label="Total Debit" value={formatCurrency(stats.totalDebit)} icon={BadgeCheck} />
          <JurnalStat label="Total Kredit" value={formatCurrency(stats.totalKredit)} icon={BadgeCheck} />
          <JurnalStat label="Jurnal Draft" value={stats.jumlahDraft} icon={Clock3} />
        </div>

        <div className="mt-5 grid gap-3 lg:items-end lg:grid-cols-[1fr_auto_auto]">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Cari</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Nomor jurnal, keterangan, referensi, atau nama akun"
                className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
              />
            </div>
          </label>

          <div className="w-full lg:w-72">
            <DateRangePicker
              start={startDate}
              end={endDate}
              onChange={({ start, end }) => {
                setStartDate(start);
                setEndDate(end);
                setPage(1);
              }}
            />
          </div>

          <div className="w-full lg:w-48">
            <Select
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusJurnal | "semua");
                setPage(1);
              }}
              options={[
                { label: "Semua", value: "semua" },
                { label: "Draft", value: "draft" },
                { label: "Diposting", value: "diposting" },
                { label: "Dibatalkan", value: "dibatalkan" }
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-stone-200 px-3 text-xs font-black text-stone-600 transition hover:bg-stone-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filter
          </button>
          <p className="text-sm font-semibold text-stone-500">{rows.length} jurnal ditemukan</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Nomor Jurnal</th>
                  <th className="px-5 py-4">Referensi</th>
                  <th className="px-5 py-4">Keterangan</th>
                  <th className="px-5 py-4">Akun</th>
                  <th className="px-5 py-4 text-right">Debit</th>
                  <th className="px-5 py-4 text-right">Kredit</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Dibuat Oleh</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-sm font-semibold text-stone-500">
                      Memuat data jurnal...
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((item) => {
                    const meta = statusMeta[item.status];
                    const isExpanded = expandedId === item.id;
                    const firstAccount = item.details[0];
                    const extraCount = item.details.length - 1;

                    return (
                      <Fragment key={item.id}>
                        <tr className="border-t border-stone-100 transition hover:bg-[#f8f7f3]">
                          <td className="px-5 py-4 text-sm font-bold text-stone-700">
                            {formatDate(item.tanggal)}
                          </td>
                          <td className="px-5 py-4 font-black text-[#20201d]">{item.nomor}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-stone-500">
                            {item.nomorReferensi || "-"}
                          </td>
                          <td className="px-5 py-4 max-w-[220px] truncate text-sm font-semibold text-stone-700">
                            {item.deskripsi}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-stone-700">
                            <div className="min-w-0">
                              <p className="truncate">{firstAccount?.namaAkun ?? "-"}</p>
                              {extraCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                  className="mt-1 text-xs font-black text-[#0f766e] hover:underline"
                                >
                                  {isExpanded ? "Sembunyikan" : `+${extraCount} akun lainnya`}
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-black text-[#20201d]">
                            {formatCurrency(item.totalDebit)}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-[#20201d]">
                            {formatCurrency(item.totalKredit)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-stone-500">
                            {item.namaDibuatOleh ?? "-"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <Link
                                href={`/jurnal/${item.id}`}
                                aria-label="Lihat detail"
                                className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
                              >
                                <Eye className="h-4 w-4" strokeWidth={1.9} />
                              </Link>
                              <Link
                                href={`/jurnal/${item.id}?autoprint=1`}
                                aria-label="Cetak"
                                className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
                              >
                                <Printer className="h-4 w-4" strokeWidth={1.9} />
                              </Link>
                              {canManage && item.status === "draft" ? (
                                <>
                                  <Link
                                    href={`/jurnal/${item.id}/edit`}
                                    aria-label="Edit jurnal"
                                    className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
                                  >
                                    <Pencil className="h-4 w-4" strokeWidth={1.9} />
                                  </Link>
                                  <button
                                    type="button"
                                    aria-label="Posting jurnal"
                                    onClick={() => setPending({ type: "post", item })}
                                    className="grid h-9 w-9 place-items-center rounded-full text-emerald-600 transition hover:bg-emerald-50"
                                  >
                                    <BadgeCheck className="h-4 w-4" strokeWidth={1.9} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Hapus jurnal"
                                    onClick={() => setPending({ type: "delete", item })}
                                    className="grid h-9 w-9 place-items-center rounded-full text-red-600 transition hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-t border-stone-100 bg-[#f8f7f3]/60">
                            <td colSpan={10} className="px-5 py-4">
                              <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                                <table className="min-w-full text-left text-xs">
                                  <thead className="bg-stone-50 font-black uppercase text-stone-400">
                                    <tr>
                                      <th className="px-4 py-2">Kode</th>
                                      <th className="px-4 py-2">Nama Akun</th>
                                      <th className="px-4 py-2">Keterangan</th>
                                      <th className="px-4 py-2 text-right">Debit</th>
                                      <th className="px-4 py-2 text-right">Kredit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.details.map((detail) => (
                                      <tr key={detail.id} className="border-t border-stone-100">
                                        <td className="px-4 py-2 font-bold text-stone-600">{detail.kodeAkun}</td>
                                        <td className="px-4 py-2 font-semibold text-stone-700">{detail.namaAkun}</td>
                                        <td className="px-4 py-2 text-stone-500">{detail.keterangan || "-"}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-stone-700">
                                          {detail.debit > 0 ? formatCurrency(detail.debit) : "-"}
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-stone-700">
                                          {detail.kredit > 0 ? formatCurrency(detail.kredit) : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <FileMinus2 className="h-8 w-8" strokeWidth={1.6} />
                        <p className="text-sm font-bold text-stone-500">
                          Belum ada jurnal yang cocok dengan filter ini.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.type === "post" ? "Posting jurnal?" : "Hapus jurnal?"}
        description={
          pending?.type === "post"
            ? `Jurnal ${pending.item.nomor} akan diposting dan tidak dapat diedit atau dihapus lagi setelah ini.`
            : `Jurnal ${pending?.item.nomor} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={isSubmitting ? "Memproses..." : pending?.type === "post" ? "Posting" : "Hapus"}
        onConfirm={handleConfirm}
        onClose={() => setPending(null)}
      />
    </>
  );
}
