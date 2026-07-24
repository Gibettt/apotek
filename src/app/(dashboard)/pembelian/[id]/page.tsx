import Link from "next/link";
import { ArrowLeft, PackageCheck, ReceiptText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { pembelianService } from "@/services/pembelianService";
import type { StatusPembelian } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const statusMeta: Record<
  StatusPembelian,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  draft: { label: "Draft", variant: "warning" },
  diterima: { label: "Diterima", variant: "success" },
  dibatalkan: { label: "Dibatalkan", variant: "danger" }
};

export default async function DetailPembelianPage({
  params
}: {
  params: { id: string };
}) {
  const pembelian = await pembelianService
    .getById(params.id)
    .catch(() => null);

  if (!pembelian) {
    return (
      <>
        <Header
          title="Pembelian tidak ditemukan"
          description="Data pembelian tidak tersedia di Supabase."
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

  const meta = statusMeta[pembelian.status];

  return (
    <>
      <Header
        title={pembelian.nomorInternal}
        description="Detail pembelian supplier dan item stok masuk."
        action={
          <Link
            href="/pembelian"
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
              <PackageCheck className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Item Pembelian
              </h2>
              <p className="text-sm font-semibold text-stone-500">
                {pembelian.details.length} item dalam transaksi ini.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Obat</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Expired</th>
                  <th className="px-5 py-4">Jumlah</th>
                  <th className="px-5 py-4">Harga</th>
                  <th className="px-5 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pembelian.details.length ? (
                  pembelian.details.map((detail) => (
                    <tr
                      key={detail.id}
                      className="border-t border-stone-100 transition hover:bg-[#f8f7f3]"
                    >
                      <td className="px-5 py-4 font-black text-[#20201d]">
                        {detail.namaBarang}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {detail.batchNumber || "-"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {detail.tanggalExpired
                          ? formatDate(detail.tanggalExpired)
                          : "-"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {detail.jumlah}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-600">
                        {formatCurrency(detail.hargaBeli)}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-[#20201d]">
                        {formatCurrency(detail.subtotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm font-semibold text-stone-500"
                    >
                      Belum ada item pembelian.
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
              <strong className="text-right text-[#20201d]">
                {pembelian.namaSupplier}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Tanggal</span>
              <strong className="text-[#20201d]">
                {pembelian.tanggalFaktur
                  ? formatDate(pembelian.tanggalFaktur)
                  : "-"}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <strong className="text-[#20201d]">
                {formatCurrency(pembelian.subtotal)}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Diskon</span>
              <strong className="text-[#20201d]">
                {formatCurrency(pembelian.diskonTotal)}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Pajak</span>
              <strong className="text-[#20201d]">
                {formatCurrency(pembelian.pajakTotal)}
              </strong>
            </div>
            <div className="border-t border-stone-200 pt-3">
              <div className="flex justify-between gap-4">
                <span>Total</span>
                <strong className="text-xl text-[#20201d]">
                  {formatCurrency(pembelian.grandTotal)}
                </strong>
              </div>
            </div>
          </div>

          {pembelian.catatan ? (
            <p className="mt-5 rounded-lg bg-[#f8f7f3] p-3 text-sm font-semibold leading-6 text-stone-600">
              {pembelian.catatan}
            </p>
          ) : null}
        </aside>
      </section>
    </>
  );
}
