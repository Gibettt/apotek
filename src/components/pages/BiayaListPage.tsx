"use client";

import Link from "next/link";
import { Banknote, Eye, FileMinus2, Plus, Receipt, RotateCcw, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { biayaService } from "@/services/biayaService";
import type { BiayaOperasional } from "@/services/biayaService";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 8;

function BiayaStat({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
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

export function BiayaListPage() {
  const { allowed: canManage } = useRoleGuard(["owner", "admin"]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"semua" | "diposting" | "dibatalkan">("semua");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<BiayaOperasional[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const result = await biayaService.list({ search, perPage: 9999 });
        if (active) {
          setRows(result.data);
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Gagal memuat data biaya operasional");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [search]);

  const filteredRows = useMemo(() => {
    if (status === "semua") {
      return rows;
    }
    return rows.filter((row) => (status === "dibatalkan" ? Boolean(row.dibatalkanAt) : !row.dibatalkanAt));
  }, [rows, status]);

  const stats = useMemo(
    () => ({
      jumlahTransaksi: filteredRows.length,
      totalJumlah: filteredRows.reduce((sum, row) => sum + row.jumlah, 0),
      jumlahDibatalkan: rows.filter((row) => row.dibatalkanAt).length
    }),
    [filteredRows, rows]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Header
        title="Biaya Operasional"
        description="Pencatatan pengeluaran operasional apotek, otomatis tercatat sebagai jurnal umum."
        action={
          canManage ? (
            <Link
              href="/biaya/tambah"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
            >
              <Plus className="h-4 w-4" />
              Tambah Biaya
            </Link>
          ) : null
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <div className="grid gap-3 md:grid-cols-3">
          <BiayaStat label="Jumlah Transaksi" value={stats.jumlahTransaksi} icon={Receipt} />
          <BiayaStat label="Total Biaya" value={formatCurrency(stats.totalJumlah)} icon={Banknote} />
          <BiayaStat label="Dibatalkan" value={stats.jumlahDibatalkan} icon={RotateCcw} />
        </div>

        <div className="mt-5 grid gap-3 lg:items-end lg:grid-cols-[1fr_auto]">
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
                placeholder="Nomor, nama biaya, atau akun beban"
                className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
              />
            </div>
          </label>

          <div className="w-full lg:w-48">
            <Select
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
                setPage(1);
              }}
              options={[
                { label: "Semua", value: "semua" },
                { label: "Diposting", value: "diposting" },
                { label: "Dibatalkan", value: "dibatalkan" }
              ]}
            />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Nomor</th>
                  <th className="px-5 py-4">Akun Beban</th>
                  <th className="px-5 py-4">Nama Biaya</th>
                  <th className="px-5 py-4 text-right">Jumlah</th>
                  <th className="px-5 py-4">Metode</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Dibuat Oleh</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm font-semibold text-stone-500">
                      Memuat data biaya operasional...
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((item) => (
                    <tr key={item.id} className="border-t border-stone-100 transition hover:bg-[#f8f7f3]">
                      <td className="px-5 py-4 text-sm font-bold text-stone-700">{formatDate(item.tanggal)}</td>
                      <td className="px-5 py-4 font-black text-[#20201d]">{item.nomor}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-stone-700">
                        {item.kodeAkun} — {item.namaAkun}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-stone-700">{item.namaBiaya}</td>
                      <td className="px-5 py-4 text-right font-black text-[#20201d]">
                        {formatCurrency(item.jumlah)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold capitalize text-stone-500">
                        {item.metodeBayar}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={item.dibatalkanAt ? "danger" : "success"}>
                          {item.dibatalkanAt ? "Dibatalkan" : "Diposting"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-stone-500">
                        {item.namaDibuatOleh ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/biaya/${item.id}`}
                          aria-label="Lihat detail"
                          className="inline-grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.9} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <FileMinus2 className="h-8 w-8" strokeWidth={1.6} />
                        <p className="text-sm font-bold text-stone-500">
                          Belum ada biaya operasional yang cocok dengan filter ini.
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
    </>
  );
}
