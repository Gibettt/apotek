"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  History,
  Pencil,
  Printer,
  RotateCcw,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { jurnalService } from "@/services/jurnalService";
import type { JurnalUmum, StatusJurnal } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";

const statusMeta: Record<
  StatusJurnal,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  draft: { label: "Draft", variant: "warning" },
  diposting: { label: "Diposting", variant: "success" },
  dibatalkan: { label: "Dibatalkan", variant: "danger" }
};

type PendingAction = "post" | "delete" | "reverse" | null;

export function JurnalDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allowed: canManage } = useRoleGuard(["owner", "admin"]);

  const [jurnal, setJurnal] = useState<JurnalUmum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState<PendingAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const result = await jurnalService.getById(id);
      setJurnal(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat detail jurnal");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!isLoading && jurnal && searchParams?.get("autoprint") === "1") {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, jurnal, searchParams]);

  async function handleConfirm() {
    if (!pending || !jurnal) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (pending === "post") {
        await jurnalService.post(jurnal.id);
        toast.success(`${jurnal.nomor} berhasil diposting`);
        await load();
      } else if (pending === "delete") {
        await jurnalService.deleteDraft(jurnal.id);
        toast.success(`${jurnal.nomor} berhasil dihapus`);
        router.push("/jurnal");
        return;
      } else if (pending === "reverse") {
        await jurnalService.reverse(jurnal.id);
        toast.success(`${jurnal.nomor} dibatalkan lewat jurnal pembalik`);
        await load();
      }
      setPending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aksi gagal dijalankan");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-10 text-center text-sm font-semibold text-stone-500 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        Memuat detail jurnal...
      </div>
    );
  }

  if (!jurnal) {
    return (
      <div className="rounded-lg bg-white p-10 text-center shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <p className="text-sm font-bold text-stone-500">Jurnal tidak ditemukan.</p>
        <Link href="/jurnal" className="mt-3 inline-block text-sm font-black text-[#0f766e] hover:underline">
          Kembali ke Jurnal Umum
        </Link>
      </div>
    );
  }

  const meta = statusMeta[jurnal.status];

  return (
    <>
      <style>{"@media print { .no-print { display: none !important; } }"}</style>

      <div className="no-print">
        <Header
          title={`Detail Jurnal ${jurnal.nomor}`}
          description="Rincian transaksi jurnal umum dalam format akuntansi."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/jurnal"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
              >
                <Printer className="h-4 w-4" />
                Cetak
              </button>
              {canManage && jurnal.status === "draft" ? (
                <>
                  <Link
                    href={`/jurnal/${jurnal.id}/edit`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPending("post")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#115e59]"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Posting
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending("delete")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </>
              ) : null}
              {canManage && jurnal.status === "diposting" ? (
                <button
                  type="button"
                  onClick={() => setPending("reverse")}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Batalkan (Jurnal Pembalik)
                </button>
              ) : null}
            </div>
          }
        />
      </div>

      <section className="rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(25,24,21,.08)] print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Nomor Jurnal</p>
            <p className="mt-1 text-2xl font-black text-[#20201d]">{jurnal.nomor}</p>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>

        <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Tanggal</p>
            <p className="mt-1 font-bold text-stone-700">{formatDate(jurnal.tanggal)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Referensi</p>
            <p className="mt-1 font-bold text-stone-700">{jurnal.nomorReferensi || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Sumber Transaksi</p>
            <p className="mt-1 font-bold capitalize text-stone-700">{jurnal.sumber}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Dibuat Oleh</p>
            <p className="mt-1 font-bold text-stone-700">{jurnal.namaDibuatOleh ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Waktu Posting</p>
            <p className="mt-1 font-bold text-stone-700">
              {jurnal.postedAt ? formatDateTime(jurnal.postedAt) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Diposting Oleh</p>
            <p className="mt-1 font-bold text-stone-700">{jurnal.namaPostedBy ?? "-"}</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs font-black uppercase text-stone-400">Keterangan</p>
            <p className="mt-1 font-semibold text-stone-700">{jurnal.deskripsi}</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
              <tr>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Nama Akun</th>
                <th className="px-5 py-3">Keterangan</th>
                <th className="px-5 py-3 text-right">Debit</th>
                <th className="px-5 py-3 text-right">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {jurnal.details.map((detail) => (
                <tr key={detail.id} className="border-t border-stone-100">
                  <td className="px-5 py-3 font-bold text-stone-600">{detail.kodeAkun}</td>
                  <td className={`px-5 py-3 font-semibold text-stone-700 ${detail.kredit > 0 ? "pl-10" : ""}`}>
                    {detail.namaAkun}
                  </td>
                  <td className="px-5 py-3 text-stone-500">{detail.keterangan || "-"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-stone-700">
                    {detail.debit > 0 ? formatCurrency(detail.debit) : "-"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-stone-700">
                    {detail.kredit > 0 ? formatCurrency(detail.kredit) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-stone-200 bg-[#f8f7f3] font-black text-[#20201d]">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-right">
                  Total
                </td>
                <td className="px-5 py-3 text-right">{formatCurrency(jurnal.totalDebit)}</td>
                <td className="px-5 py-3 text-right">{formatCurrency(jurnal.totalKredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {jurnal.sumberTabel === "jurnal_umum" && jurnal.sumberId ? (
          <p className="no-print mt-4 flex items-center gap-2 text-xs font-bold text-amber-700">
            <History className="h-4 w-4" />
            Jurnal ini adalah jurnal pembalik dari jurnal lain.
          </p>
        ) : null}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending === "post"
            ? "Posting jurnal?"
            : pending === "delete"
              ? "Hapus jurnal?"
              : "Batalkan jurnal ini?"
        }
        description={
          pending === "post"
            ? `Jurnal ${jurnal.nomor} akan diposting dan tidak dapat diedit atau dihapus lagi setelah ini.`
            : pending === "delete"
              ? `Jurnal ${jurnal.nomor} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
              : `Sistem akan membuat jurnal pembalik untuk ${jurnal.nomor} dan menandai jurnal asli sebagai dibatalkan.`
        }
        confirmText={isSubmitting ? "Memproses..." : "Konfirmasi"}
        onConfirm={handleConfirm}
        onClose={() => setPending(null)}
      />
    </>
  );
}
