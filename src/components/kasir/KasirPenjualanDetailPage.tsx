"use client";

import { ArrowLeft, Package, ReceiptText, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KasirPageShell } from "@/components/kasir/KasirPageShell";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { statusLabel } from "@/constants/status";
import { penjualanService } from "@/services/penjualanService";
import type { Penjualan } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";

function statusVariant(status?: string): BadgeProps["variant"] {
  if (status === "selesai" || status === "lunas") return "success";
  if (status === "dibatalkan" || status === "gagal") return "danger";
  if (status === "sebagian" || status === "menunggu_pembayaran") return "warning";
  return "info";
}

function unitLabel(value?: string) {
  return value?.trim() || "item";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-bold text-[#55605a]">{label}</span>
      <strong className="text-right text-sm text-[#2d3832]">{value}</strong>
    </div>
  );
}

export function KasirPenjualanDetailPage({ id }: { id: string }) {
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
            error instanceof Error ? error.message : "Gagal memuat detail transaksi"
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

  return (
    <KasirPageShell active="riwayat">
      <main className="min-h-0 flex-1 overflow-hidden bg-[#fbfcfb] p-3">
        <section className="grid h-full min-h-0 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-[18px] bg-white p-4 shadow-[0_20px_60px_rgba(31,41,35,0.06)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-black">
                  {penjualan?.nomorInvoice ?? (isLoading ? "Memuat transaksi" : "Transaksi")}
                </p>
                <p className="text-xs font-bold text-[#89918c]">
                  Detail barang, pembayaran, dan pelanggan dari Supabase.
                </p>
              </div>
              <Link
                href="/penjualan"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e1e6e3] bg-white px-4 text-xs font-black text-[#37413b] transition hover:border-[#9bcbbb] hover:bg-[#eef3f0] hover:text-[#1f6f5d]"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                Kembali
              </Link>
            </div>

            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              {[
                ["Barang", `${penjualan?.details.length ?? 0} item`, Package],
                ["Pelanggan", penjualan?.namaPelanggan ?? "-", ReceiptText],
                ["Total", penjualan ? formatCurrency(penjualan.grandTotal) : "Rp0", Wallet]
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="rounded-[12px] border border-[#e6eae7] bg-[#fdfefd] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-stone-400">{String(label)}</p>
                    <Icon className="h-4 w-4 text-[#0f766e]" strokeWidth={1.9} />
                  </div>
                  <p className="mt-2 truncate text-sm font-black text-[#2d3832]">{String(value)}</p>
                </div>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-[14px] border border-[#e6eae7] bg-white">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#f7faf8] text-xs font-black uppercase text-stone-500">
                  <tr>
                    <th className="px-5 py-4">Barang</th>
                    <th className="px-5 py-4">Qty</th>
                    <th className="px-5 py-4">Satuan</th>
                    <th className="px-5 py-4">Harga</th>
                    <th className="px-5 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center font-bold text-stone-500">
                        Memuat detail transaksi...
                      </td>
                    </tr>
                  ) : penjualan ? (
                    penjualan.details.map((detail) => (
                      <tr key={detail.id} className="border-t border-stone-100">
                        <td className="px-5 py-4 font-black text-[#2d3832]">{detail.namaBarang}</td>
                        <td className="px-5 py-4 font-bold text-stone-600">{detail.jumlah}</td>
                        <td className="px-5 py-4 font-bold text-stone-600">{unitLabel(detail.satuanNama)}</td>
                        <td className="px-5 py-4 font-black text-[#2d3832]">{formatCurrency(detail.hargaJual)}</td>
                        <td className="px-5 py-4 text-right font-black text-[#0f766e]">{formatCurrency(detail.subtotal)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center font-bold text-stone-500">
                        {errorMessage || "Transaksi tidak ditemukan."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#dce8e2] bg-[#f5faf7] p-4 text-[#262b28] shadow-[0_20px_60px_rgba(31,41,35,0.06)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-black">Ringkasan</p>
                <p className="text-xs font-bold text-[#89918c]">Detail pembayaran</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f5ef] text-[#267d6b]">
                <ReceiptText className="h-5 w-5" strokeWidth={1.9} />
              </span>
            </div>

            {penjualan ? (
              <>
                <div className="space-y-4 rounded-[16px] bg-white p-4">
                  <InfoRow label="Pelanggan" value={penjualan.namaPelanggan} />
                  <InfoRow label="Waktu" value={formatDateTime(penjualan.tanggal)} />
                  <InfoRow label="Pembayaran" value={penjualan.metodePembayaran ?? "-"} />
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-[#55605a]">Status</span>
                    <Badge variant={statusVariant(penjualan.status)}>{statusLabel(penjualan.status)}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-[#55605a]">Status Bayar</span>
                    <Badge variant={statusVariant(penjualan.statusBayar)}>{statusLabel(penjualan.statusBayar)}</Badge>
                  </div>
                </div>

                <div className="mt-3 space-y-3 rounded-[12px] border border-[#dce8e2] bg-white p-4 text-sm font-bold text-[#55605a]">
                  <InfoRow label="Subtotal" value={formatCurrency(penjualan.subtotal)} />
                  <InfoRow label="Bayar" value={formatCurrency(penjualan.bayarTotal)} />
                  <InfoRow label="Kembalian" value={formatCurrency(penjualan.kembalian)} />
                </div>

                <div className="mt-3 rounded-[16px] bg-white p-4">
                  <p className="text-xs font-black uppercase text-stone-400">Total Payment</p>
                  <p className="mt-2 text-3xl font-black text-[#0f766e]">
                    {formatCurrency(penjualan.grandTotal)}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-[12px] border border-[#dce8e2] bg-white p-5 text-sm font-bold text-[#55605a]">
                {isLoading ? "Memuat ringkasan..." : errorMessage || "Transaksi tidak ditemukan."}
              </div>
            )}
          </aside>
        </section>
      </main>
    </KasirPageShell>
  );
}
