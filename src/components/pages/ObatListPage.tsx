"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Boxes,
  Eye,
  Pencil,
  Pill,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { obatService } from "@/services/obatService";
import type { Obat } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

const perPage = 8;

function getStockState(item: Obat) {
  if (item.stokTersedia <= Math.max(1, Math.round(item.stokMinimum * 0.25))) {
    return {
      label: "Kritis",
      badge: "danger" as const,
      bar: "bg-red-500",
      bg: "bg-red-50"
    };
  }

  if (item.stokTersedia < item.stokMinimum) {
    return {
      label: "Menipis",
      badge: "warning" as const,
      bar: "bg-amber-500",
      bg: "bg-amber-50"
    };
  }

  return {
    label: "Stok OK",
    badge: "success" as const,
    bar: "bg-emerald-500",
    bg: "bg-emerald-50"
  };
}

function StockStat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg bg-[#f8f7f3] p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#ff6a3d] shadow-sm">
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div>
          <p className="text-2xl font-black leading-none text-[#20201d]">
            {value}
          </p>
          <p className="mt-1 text-xs font-bold text-stone-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ObatRow({
  item,
  onDelete
}: {
  item: Obat;
  onDelete: (item: Obat) => void;
}) {
  const stock = getStockState(item);
  const progress = Math.min(
    100,
    Math.round((item.stokTersedia / Math.max(item.stokMinimum * 2, 1)) * 100)
  );

  return (
    <tr className="group border-t border-stone-100 transition hover:bg-[#f8f7f3]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${stock.bg} text-[#ff6a3d]`}>
            <Pill className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-[#20201d]">
              {item.nama}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-stone-400">
              {item.kode} - {item.satuanNama ?? "-"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-bold text-stone-700">
          {item.kategoriNama ?? "-"}
        </p>
        <p className="mt-1 max-w-[180px] truncate text-xs font-semibold text-stone-400">
          {item.golonganNama ?? "-"}
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="min-w-[150px]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-black text-[#20201d]">
              {item.stokTersedia}
            </span>
            <span className="text-xs font-semibold text-stone-400">
              Min {item.stokMinimum}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full rounded-full ${stock.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="font-black text-[#20201d]">
          {formatCurrency(item.hargaAktif?.hargaJual ?? 0)}
        </p>
        <p className="mt-1 text-xs font-semibold text-stone-400">
          Beli {formatCurrency(item.hargaAktif?.hargaBeli ?? 0)}
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={stock.badge}>{stock.label}</Badge>
          {item.membutuhkanResep ? (
            <Badge variant="info">Resep</Badge>
          ) : (
            <Badge variant="muted">Bebas</Badge>
          )}
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={`/obat/${item.id}`}
            aria-label="Detail obat"
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
          >
            <Eye className="h-4 w-4" strokeWidth={1.9} />
          </Link>
          <Link
            href={`/obat/${item.id}/edit`}
            aria-label="Edit obat"
            title="Edit obat"
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f8f7f3] text-stone-700 transition hover:bg-white hover:text-stone-950 hover:shadow-sm"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.9} />
          </Link>
          <button
            type="button"
            aria-label={`Hapus ${item.nama}`}
            onClick={() => onDelete(item)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function ObatListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Obat[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function handleDelete(item: Obat) {
    const confirmed = window.confirm(
      `Hapus ${item.nama} dari daftar stok obat?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await obatService.delete(item.id);
      setRows((currentRows) =>
        currentRows.filter((row) => row.id !== item.id)
      );
      setTotal((currentTotal) => Math.max(0, currentTotal - 1));
      toast.success(`${item.nama} berhasil dihapus`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus obat"
      );
    }
  }

  useEffect(() => {
    let active = true;

    async function loadObat() {
      setIsLoading(true);

      try {
        const result = await obatService.list({ search, page, perPage });

        if (!active) {
          return;
        }

        setRows(result.data);
        setTotal(result.total);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat data obat"
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadObat();

    return () => {
      active = false;
    };
  }, [page, search]);

  const stats = useMemo(() => {
    const lowItems = rows.filter(
      (item) => item.stokTersedia < item.stokMinimum
    ).length;

    return { lowItems };
  }, [rows]);

  return (
    <>
      <Header
        title="Stok Barang"
        description="Daftar barang dengan harga, stok, kategori, supplier, dan status resep."
        action={
          <Link
            href="/obat/tambah"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Link>
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <div className="grid gap-3 md:grid-cols-2">
          <StockStat label="Total barang" value={total} icon={Boxes} />
          <StockStat label="Stok menipis" value={stats.lowItems} icon={AlertTriangle} />
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari barang, kode, satuan, golongan..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            />
          </div>

          <p className="text-sm font-semibold text-stone-500">
            {total} item barang ditemukan
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Barang</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Stok</th>
                  <th className="px-5 py-4">Harga</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="w-[156px] px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Memuat data obat...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((item) => (
                    <ObatRow
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Belum ada barang yang cocok.
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
