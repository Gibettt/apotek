"use client";

import Link from "next/link";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { penjualanService } from "@/services/penjualanService";
import type { Penjualan } from "@/types";
import { statusLabel } from "@/constants/status";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";

function statusVariant(status?: string): BadgeProps["variant"] {
  if (status === "selesai" || status === "lunas") return "success";
  if (status === "dibatalkan" || status === "gagal") return "danger";
  if (status === "sebagian" || status === "menunggu_pembayaran") {
    return "warning";
  }
  return "info";
}

function unitLabel(value?: string) {
  return value?.trim() || "item";
}

export function PenjualanDetailPage({ id }: { id: string }) {
  const [penjualan, setPenjualan] = useState<Penjualan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    penjualanService
      .getById(id)
      .then((result) => {
        if (active) setPenjualan(result);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Gagal memuat detail transaksi"
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header
          title="Memuat transaksi"
          description="Mengambil detail transaksi penjualan."
        />
        <Card>
          <CardContent>
            <p className="text-sm font-semibold text-slate-600">
              Memuat data transaksi...
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!penjualan) {
    return (
      <>
        <Header
          title="Data tidak ditemukan"
          description="Riwayat transaksi penjualan, pembayaran, kembalian, dan status."
          action={
            <Link href="/penjualan">
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              {errorMessage ||
                "Transaksi ini tidak tersedia untuk sesi atau dataset saat ini."}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header
        title={penjualan.nomorInvoice}
        description="Detail transaksi penjualan, pembayaran, dan barang yang dibeli."
        action={
          <Link href="/penjualan">
            <Button type="button" variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Barang Terjual">
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {penjualan.details.length} barang dalam transaksi ini.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                    <tr>
                      <th className="px-5 py-3">Barang</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Satuan</th>
                      <th className="px-5 py-3">Harga</th>
                      <th className="px-5 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penjualan.details.length ? (
                      penjualan.details.map((detail) => (
                        <tr key={detail.id} className="border-t border-stone-100">
                          <td className="px-5 py-4 font-black text-[#20201d]">
                            {detail.namaBarang}
                          </td>
                          <td className="px-5 py-4 font-bold text-stone-600">
                            {detail.jumlah}
                          </td>
                          <td className="px-5 py-4 font-bold text-stone-600">
                            {unitLabel(detail.satuanNama)}
                          </td>
                          <td className="px-5 py-4 font-black text-[#20201d]">
                            {formatCurrency(detail.hargaJual)}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-[#0f766e]">
                            {formatCurrency(detail.subtotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-sm font-bold text-stone-500"
                        >
                          Belum ada detail barang untuk transaksi ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5">
          <Card>
            <CardHeader
              title="Ringkasan"
              action={
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f8f7f3] text-[#0f766e]">
                  <ReceiptText className="h-5 w-5" strokeWidth={1.9} />
                </span>
              }
            />
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Pelanggan
                </span>
                <strong className="text-right text-sm text-[#20201d]">
                  {penjualan.namaPelanggan}
                </strong>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Waktu
                </span>
                <strong className="text-right text-sm text-[#20201d]">
                  {formatDateTime(penjualan.tanggal)}
                </strong>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Pembayaran
                </span>
                <strong className="text-right text-sm text-[#20201d]">
                  {penjualan.metodePembayaran ?? "-"}
                </strong>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Status
                </span>
                <Badge variant={statusVariant(penjualan.status)}>
                  {statusLabel(penjualan.status)}
                </Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Status Bayar
                </span>
                <Badge variant={statusVariant(penjualan.statusBayar)}>
                  {statusLabel(penjualan.statusBayar)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Subtotal
                </span>
                <strong className="text-sm text-[#20201d]">
                  {formatCurrency(penjualan.subtotal)}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Bayar
                </span>
                <strong className="text-sm text-[#20201d]">
                  {formatCurrency(penjualan.bayarTotal)}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  Kembalian
                </span>
                <strong className="text-sm text-[#20201d]">
                  {formatCurrency(penjualan.kembalian)}
                </strong>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-black uppercase text-slate-400">
                    Total
                  </span>
                  <strong className="text-xl font-black text-[#0f766e]">
                    {formatCurrency(penjualan.grandTotal)}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
