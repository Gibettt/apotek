import Link from "next/link";
import { ArrowLeft, PackageMinus, ReceiptText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { returPembelianService } from "@/services/returPembelianService";
import type { StatusRetur } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const statusMeta: Record<StatusRetur, { label: string; variant: "success" | "warning" | "danger" | "muted" }> = {
  draft: { label: "Draft", variant: "warning" },
  posted: { label: "Posted", variant: "success" },
  dibatalkan: { label: "Dibatalkan", variant: "danger" }
};

export default async function DetailReturPage({ params }: { params: { id: string } }) {
  const retur = await returPembelianService.getById(params.id).catch(() => null);

  if (!retur) {
    return (
      <>
        <Header title="Retur tidak ditemukan" description="Data retur tidak tersedia di Supabase." />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">Data yang diminta tidak tersedia.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  const meta = statusMeta[retur.status];

  return (
    <>
      <Header
        title={retur.nomor}
        description="Detail retur pembelian ke supplier dan item stok keluar."
        action={
          <Link
            href="/retur"
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
              <PackageMinus className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Item Retur</h2>
              <p className="text-sm font-semibold text-stone-500">{retur.details.length} item dalam retur ini.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Obat</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Jumlah</th>
                  <th className="px-5 py-4">Harga</th>
                  <th className="px-5 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {retur.details.length ? (
                  retur.details.map((detail) => (
                    <tr key={detail.id} className="border-t border-stone-100 transition hover:bg-[#f8f7f3]">
                      <td className="px-5 py-4 font-black text-[#20201d]">{detail.namaBarang}</td>
                      <td className="px-5 py-4 font-semibold text-stone-600">{detail.nomorBatch || "-"}</td>
                      <td className="px-5 py-4 font-semibold text-stone-600">{detail.jumlah}</td>
                      <td className="px-5 py-4 font-semibold text-stone-600">{formatCurrency(detail.hargaBeli)}</td>
                      <td className="px-5 py-4 text-right font-black text-[#20201d]">
                        {formatCurrency(detail.subtotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-stone-500">
                      Belum ada item retur.
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
              <ReceiptText className="h-5 w-5" strokeWidth={1.9} />
            </span>
          </div>

          <div className="mt-5 space-y-3 text-sm font-semibold text-stone-600">
            <div className="flex justify-between gap-4">
              <span>Supplier</span>
              <strong className="text-right text-[#20201d]">{retur.namaSupplier}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Tanggal</span>
              <strong className="text-[#20201d]">{retur.tanggal ? formatDate(retur.tanggal) : "-"}</strong>
            </div>
            <div className="border-t border-stone-200 pt-3">
              <div className="flex justify-between gap-4">
                <span>Total</span>
                <strong className="text-xl text-[#20201d]">{formatCurrency(retur.total)}</strong>
              </div>
            </div>
          </div>

          {retur.alasan ? (
            <p className="mt-5 rounded-lg bg-[#f8f7f3] p-3 text-sm font-semibold leading-6 text-stone-600">
              {retur.alasan}
            </p>
          ) : null}
        </aside>
      </section>
    </>
  );
}
