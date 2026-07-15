import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList, Stethoscope } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { resepService } from "@/services/resepService";
import type { StatusResep } from "@/types";
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

export default async function DetailResepPage({
  params
}: {
  params: { id: string };
}) {
  const resep = await resepService.getById(params.id).catch(() => null);

  if (!resep) {
    return (
      <>
        <Header
          title="Resep tidak ditemukan"
          description="Data resep tidak tersedia di Supabase."
        />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              Data yang diminta tidak tersedia.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const meta = statusMeta[resep.status];
  const canProcess = resep.status !== "selesai" && resep.status !== "ditolak";

  return (
    <>
      <Header
        title={resep.nomorResep ?? "-"}
        description="Detail resep dokter dan item obat yang tersimpan di Supabase."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/resep"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            {canProcess ? (
              <Link
                href={`/resep/${resep.id}/proses`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#115e59]"
              >
                Proses
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <ClipboardList className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Item Resep</h2>
              <p className="text-sm font-semibold text-stone-500">
                {resep.details.length} item obat dalam resep ini.
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

        <aside className="h-max rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)] xl:sticky xl:top-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-stone-400">Status</p>
              <div className="mt-2">
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#f8f7f3] text-[#ff6a3d]">
              <Stethoscope className="h-5 w-5" strokeWidth={1.9} />
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
              <span>Dokter</span>
              <strong className="text-right text-[#20201d]">
                {resep.namaDokter}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>No SIP</span>
              <strong className="text-right text-[#20201d]">
                {resep.noSipDokter || "-"}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Faskes</span>
              <strong className="text-right text-[#20201d]">
                {resep.asalPuskesmas || "-"}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Tanggal</span>
              <strong className="text-[#20201d]">
                {resep.tanggalResep ? formatDate(resep.tanggalResep) : "-"}
              </strong>
            </div>
          </div>

          {resep.catatan ? (
            <p className="mt-5 rounded-lg bg-[#f8f7f3] p-3 text-sm font-semibold leading-6 text-stone-600">
              {resep.catatan}
            </p>
          ) : null}
        </aside>
      </section>
    </>
  );
}
