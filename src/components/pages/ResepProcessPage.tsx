"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ClipboardList, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { resepService } from "@/services/resepService";
import type { Resep, StatusResep } from "@/types";
import { formatDate } from "@/utils/formatDate";

const statusMeta: Record<
  StatusResep,
  { label: string; variant: "success" | "warning" | "danger" | "info" }
> = {
  menunggu: { label: "Menunggu", variant: "warning" },
  diproses: { label: "Diproses", variant: "info" },
  selesai: { label: "Selesai", variant: "success" },
  ditolak: { label: "Ditolak", variant: "danger" }
};

export function ResepProcessPage({ resep }: { resep: Resep }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const meta = statusMeta[resep.status];

  async function updateStatus(status: StatusResep) {
    setIsSubmitting(true);

    try {
      await resepService.updateStatus(resep.id, status);
      toast.success(`Status resep menjadi ${statusMeta[status].label}`);
      router.push(`/resep/${resep.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memproses resep"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Proses Resep"
        description="Ubah status verifikasi resep berdasarkan item obat yang sudah diinput."
        action={
          <Link
            href={`/resep/${resep.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="dashboard-surface">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <ClipboardList className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                {resep.nomorResep}
              </h2>
              <p className="text-sm font-semibold text-stone-500">
                {resep.namaPelanggan} - {resep.namaDokter}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Obat</th>
                  <th className="px-5 py-4">Aturan Pakai</th>
                  <th className="px-5 py-4">Jumlah</th>
                  <th className="px-5 py-4">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {resep.details.length ? (
                  resep.details.map((detail) => (
                    <tr
                      key={detail.id}
                      className="border-t border-stone-100 transition hover:bg-[#f8f7f3]"
                    >
                      <td className="px-5 py-4 font-black text-[#20201d]">
                        {detail.namaBarang}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {detail.aturanPakai}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {detail.jumlah}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {detail.catatan || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm font-semibold text-stone-500"
                    >
                      Belum ada item resep.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="h-max dashboard-surface xl:sticky xl:top-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-stone-400">Status</p>
              <div className="mt-2">
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#f8f7f3] text-[#ff6a3d]">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.9} />
            </span>
          </div>

          <div className="mt-5 space-y-3 text-sm font-semibold text-stone-600">
            <div className="flex justify-between gap-4">
              <span>Pelanggan</span>
              <strong className="text-right text-[#20201d]">
                {resep.namaPelanggan}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Tanggal</span>
              <strong className="text-[#20201d]">
                {resep.tanggalResep ? formatDate(resep.tanggalResep) : "-"}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Item obat</span>
              <strong className="text-[#20201d]">{resep.details.length}</strong>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {resep.status === "menunggu" ? (
              <Button
                type="button"
                isLoading={isSubmitting}
                onClick={() => updateStatus("diproses")}
                className="h-11 w-full rounded-lg bg-sky-600 font-black hover:bg-sky-700"
              >
                <ClipboardCheck className="h-4 w-4" />
                Tandai Diproses
              </Button>
            ) : null}
            {resep.status === "diproses" ? (
              <Button
                type="button"
                isLoading={isSubmitting}
                onClick={() => updateStatus("selesai")}
                className="h-11 w-full rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Selesaikan Resep
              </Button>
            ) : null}
            {resep.status !== "selesai" && resep.status !== "ditolak" ? (
              <Button
                type="button"
                isLoading={isSubmitting}
                onClick={() => updateStatus("ditolak")}
                className="h-11 w-full rounded-lg bg-red-600 font-black hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" />
                Tolak Resep
              </Button>
            ) : null}
          </div>
        </aside>
      </section>
    </>
  );
}
