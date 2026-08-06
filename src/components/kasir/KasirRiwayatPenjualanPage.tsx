"use client";

import { Eye, ReceiptText, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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

export function KasirRiwayatPenjualanPage() {
  const [rows, setRows] = useState<Penjualan[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    penjualanService
      .list({ perPage: 1000 })
      .then((result) => {
        if (active) setRows(result.data);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Gagal memuat riwayat penjualan")
      )
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) =>
      [row.nomorInvoice, row.namaPelanggan, row.metodePembayaran, row.status]
        .some((value) => String(value ?? "").toLowerCase().includes(keyword))
    );
  }, [rows, search]);

  return (
    <KasirPageShell active="riwayat">
      <main className="min-h-0 flex-1 overflow-hidden rounded-b-[16px] bg-[#151514]">
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#e6f3c4] p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xl font-black">Riwayat Penjualan</p>
              <p className="text-xs font-bold text-[#59633d]">
                Transaksi, pembayaran, pelanggan, dan status dari Supabase.
              </p>
            </div>
            <div className="grid h-12 min-w-[118px] place-items-center rounded-[16px] bg-white px-4 text-center">
              <p className="text-xs font-bold text-stone-400">Total data</p>
              <p className="text-base font-black text-[#0f766e]">{filteredRows.length}</p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nomor, pelanggan, bayar, status"
                className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-4 text-sm font-bold outline-none ring-1 ring-white/70 placeholder:text-stone-400 focus:ring-4 focus:ring-[#cbb8ff]/60"
              />
            </label>
            <div className="hidden items-center gap-3 rounded-[16px] bg-[#151514] px-4 text-white lg:flex">
              <ReceiptText className="h-5 w-5 text-[#d5eb72]" strokeWidth={1.9} />
              <div>
                <p className="text-[11px] font-bold text-white/50">Sumber</p>
                <p className="text-sm font-black">Supabase</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-[18px] bg-white">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f5ef] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Nomor</th>
                  <th className="px-5 py-4">Pelanggan</th>
                  <th className="px-5 py-4">Waktu</th>
                  <th className="px-5 py-4">Bayar</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center font-bold text-stone-500">
                      Memuat riwayat penjualan...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="border-t border-stone-100">
                      <td className="px-5 py-4 font-black text-[#20201d]">{row.nomorInvoice}</td>
                      <td className="px-5 py-4 font-bold text-stone-700">{row.namaPelanggan}</td>
                      <td className="px-5 py-4 font-bold text-stone-600">{formatDateTime(row.tanggal)}</td>
                      <td className="px-5 py-4 font-bold text-stone-600">{row.metodePembayaran ?? "-"}</td>
                      <td className="px-5 py-4 font-black text-[#20201d]">{formatCurrency(row.grandTotal)}</td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/penjualan/${row.id}`}
                          aria-label={`Lihat ${row.nomorInvoice}`}
                          className="inline-grid h-9 w-9 place-items-center rounded-full bg-[#cbb8ff] text-[#171717] transition hover:bg-[#b49af7]"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.9} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center font-bold text-stone-500">
                      Riwayat penjualan belum ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </KasirPageShell>
  );
}
