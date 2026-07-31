"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Lock,
  PackageSearch,
  ReceiptText,
  Search,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import {
  pembelianService,
  type PembelianHistoryItem
} from "@/services/pembelianService";
import { supplierService } from "@/services/supplierService";
import { useAuthStore } from "@/store/authStore";
import type { StatusPembelian, Supplier } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const perPage = 12;

const statusMeta: Record<
  StatusPembelian,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  draft: { label: "Draft", variant: "warning" },
  diterima: { label: "Diterima", variant: "success" },
  dibatalkan: { label: "Dibatalkan", variant: "danger" }
};

function discountLabel(item: PembelianHistoryItem) {
  const parts = [];
  if (item.diskonPersen > 0) parts.push(`${item.diskonPersen}%`);
  if (item.diskonNominal > 0) parts.push(formatCurrency(item.diskonNominal));
  return parts.length ? parts.join(" + ") : "-";
}

export function PembelianHistoryPage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "owner") {
    return (
      <>
        <Header
          title="Riwayat pembelian terkunci"
          description="Riwayat pembelian supplier hanya bisa diakses akun owner."
        />
        <section className="dashboard-surface grid min-h-[360px] place-items-center">
          <div className="grid max-w-sm place-items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b]">
              <Lock className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h2 className="text-xl font-black text-[#20201d]">Khusus Owner</h2>
            <p className="text-sm font-semibold leading-6 text-stone-500">
              Data riwayat pembelian hanya bisa dilihat akun owner.
            </p>
          </div>
        </section>
      </>
    );
  }

  return <PembelianHistoryContent />;
}

function PembelianHistoryContent() {
  const [search, setSearch] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PembelianHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    let active = true;

    async function loadSuppliers() {
      try {
        const result = await supplierService.list({ perPage: 1000 });
        if (active) {
          setSuppliers(result.data);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat supplier"
          );
        }
      }
    }

    void loadSuppliers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setIsLoading(true);

      try {
        const result = await pembelianService.listHistory({
          search,
          ...(purchaseDate ? { purchaseDate } : {}),
          ...(supplierId ? { supplierId } : {}),
          page,
          perPage
        });

        if (!active) return;

        setRows(result.data);
        setTotal(result.total);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat riwayat pembelian"
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [page, search, purchaseDate, supplierId]);

  const pageValue = useMemo(
    () => rows.reduce((sum, item) => sum + item.subtotal, 0),
    [rows]
  );

  return (
    <>
      <Header
        title="Riwayat Pembelian"
        description="Daftar item barang yang dibeli dari supplier berdasarkan tanggal pembelian."
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

      <section className="dashboard-surface">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-[#f8f7f3] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#ff6a3d] shadow-sm">
                <PackageSearch className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-2xl font-black leading-none text-[#20201d]">
                  {total}
                </p>
                <p className="mt-1 text-xs font-bold text-stone-500">Item ditemukan</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-[#f8f7f3] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#ff6a3d] shadow-sm">
                <ReceiptText className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-2xl font-black leading-none text-[#20201d]">
                  {formatCurrency(pageValue)}
                </p>
                <p className="mt-1 text-xs font-bold text-stone-500">Nilai halaman</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-[#f8f7f3] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#ff6a3d] shadow-sm">
                <CalendarDays className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-lg font-black leading-none text-[#20201d]">
                  {purchaseDate ? formatDate(purchaseDate) : "Semua tanggal"}
                </p>
                <p className="mt-1 text-xs font-bold text-stone-500">Tanggal pembelian</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_260px]">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari barang, nomor PO, supplier, batch..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            />
          </div>

          <div className="relative w-full">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="date"
              aria-label="Filter tanggal pembelian"
              value={purchaseDate}
              onChange={(event) => {
                setPurchaseDate(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm font-bold text-stone-700 outline-none transition focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            />
          </div>

          <div className="relative w-full">
            <Truck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <select
              aria-label="Filter supplier"
              value={supplierId}
              onChange={(event) => {
                setSupplierId(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-black text-stone-700 outline-none transition focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            >
              <option value="">Semua supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Nomor PO</th>
                  <th className="px-5 py-4">Barang</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Expired</th>
                  <th className="px-5 py-4 text-right">Jumlah</th>
                  <th className="px-5 py-4">Satuan</th>
                  <th className="px-5 py-4 text-right">Harga</th>
                  <th className="px-5 py-4">Diskon</th>
                  <th className="px-5 py-4 text-right">Subtotal</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Memuat riwayat pembelian...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((item) => {
                    const meta = statusMeta[item.status];

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-stone-100 transition hover:bg-[#f8f7f3]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-stone-700">
                          {item.tanggalFaktur ? formatDate(item.tanggalFaktur) : "-"}
                        </td>
                        <td className="px-5 py-4 font-bold text-stone-700">
                          {item.namaSupplier}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/pembelian/${item.pembelianId}`}
                            className="font-black text-[#20201d] hover:text-[#0f766e]"
                          >
                            {item.nomorInternal}
                          </Link>
                        </td>
                        <td className="px-5 py-4 font-black text-[#20201d]">
                          {item.namaBarang}
                        </td>
                        <td className="px-5 py-4 font-semibold text-stone-600">
                          {item.batchNumber || "-"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-stone-600">
                          {item.tanggalExpired ? formatDate(item.tanggalExpired) : "-"}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-stone-600">
                          {item.jumlah}
                        </td>
                        <td className="px-5 py-4 font-semibold text-stone-600">
                          {item.satuanNama || "-"}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-stone-600">
                          {formatCurrency(item.hargaBeli)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-stone-600">
                          {discountLabel(item)}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-[#20201d]">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Belum ada riwayat pembelian yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-stone-500">
            Halaman {page} dari {totalPages}
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </section>
    </>
  );
}
