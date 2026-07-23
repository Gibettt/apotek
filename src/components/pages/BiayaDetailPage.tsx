"use client";

import Link from "next/link";
import { ArrowLeft, BookText, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { biayaService } from "@/services/biayaService";
import type { BiayaOperasional } from "@/services/biayaService";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";

export function BiayaDetailPage({ id }: { id: string }) {
  const { allowed: canManage } = useRoleGuard(["owner", "admin"]);

  const [biaya, setBiaya] = useState<BiayaOperasional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const result = await biayaService.getById(id);
      setBiaya(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat detail biaya");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleVoid() {
    if (!biaya) {
      return;
    }
    setIsSubmitting(true);
    try {
      await biayaService.void(biaya.id);
      toast.success(`${biaya.nomor} berhasil dibatalkan lewat jurnal pembalik`);
      setShowConfirm(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membatalkan biaya");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-10 text-center text-sm font-semibold text-stone-500 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        Memuat detail biaya...
      </div>
    );
  }

  if (!biaya) {
    return (
      <div className="rounded-lg bg-white p-10 text-center shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <p className="text-sm font-bold text-stone-500">Biaya operasional tidak ditemukan.</p>
        <Link href="/biaya" className="mt-3 inline-block text-sm font-black text-[#0f766e] hover:underline">
          Kembali ke Biaya Operasional
        </Link>
      </div>
    );
  }

  return (
    <>
      <Header
        title={`Detail Biaya ${biaya.nomor}`}
        description="Rincian pengeluaran operasional dan jurnal yang terhubung."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/biaya"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            {canManage && !biaya.dibatalkanAt ? (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
              >
                <RotateCcw className="h-4 w-4" />
                Batalkan (Jurnal Pembalik)
              </button>
            ) : null}
          </div>
        }
      />

      <section className="rounded-lg bg-white p-6 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Nomor</p>
            <p className="mt-1 text-2xl font-black text-[#20201d]">{biaya.nomor}</p>
          </div>
          <Badge variant={biaya.dibatalkanAt ? "danger" : "success"}>
            {biaya.dibatalkanAt ? "Dibatalkan" : "Diposting"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Tanggal</p>
            <p className="mt-1 font-bold text-stone-700">{formatDate(biaya.tanggal)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Akun Beban</p>
            <p className="mt-1 font-bold text-stone-700">
              {biaya.kodeAkun} — {biaya.namaAkun}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Metode Bayar</p>
            <p className="mt-1 font-bold capitalize text-stone-700">{biaya.metodeBayar}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Jumlah</p>
            <p className="mt-1 font-black text-[#20201d]">{formatCurrency(biaya.jumlah)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-stone-400">Dibuat Oleh</p>
            <p className="mt-1 font-bold text-stone-700">{biaya.namaDibuatOleh ?? "-"}</p>
          </div>
          {biaya.dibatalkanAt ? (
            <div>
              <p className="text-xs font-black uppercase text-stone-400">Dibatalkan</p>
              <p className="mt-1 font-bold text-stone-700">
                {formatDateTime(biaya.dibatalkanAt)} oleh {biaya.namaDibatalkanOleh ?? "-"}
              </p>
            </div>
          ) : null}
          <div className="md:col-span-3">
            <p className="text-xs font-black uppercase text-stone-400">Nama Biaya</p>
            <p className="mt-1 font-semibold text-stone-700">{biaya.namaBiaya}</p>
          </div>
          {biaya.catatan ? (
            <div className="md:col-span-3">
              <p className="text-xs font-black uppercase text-stone-400">Catatan</p>
              <p className="mt-1 font-semibold text-stone-700">{biaya.catatan}</p>
            </div>
          ) : null}
        </div>

        {biaya.jurnalId ? (
          <Link
            href={`/jurnal/${biaya.jurnalId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#f8f7f3] px-4 py-3 text-sm font-black text-[#0f766e] transition hover:bg-[#eef3ef]"
          >
            <BookText className="h-4 w-4" />
            Lihat Jurnal Umum Terkait
          </Link>
        ) : null}
      </section>

      <ConfirmDialog
        open={showConfirm}
        title="Batalkan biaya ini?"
        description={`Sistem akan membuat jurnal pembalik untuk jurnal yang terhubung dengan ${biaya.nomor}, lalu menandai biaya ini sebagai dibatalkan. Tindakan ini tidak menghapus data.`}
        confirmText={isSubmitting ? "Memproses..." : "Batalkan"}
        onConfirm={handleVoid}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}
