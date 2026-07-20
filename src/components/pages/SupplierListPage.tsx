"use client";

import Link from "next/link";
import {
  Building2,
  Eye,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { supplierService } from "@/services/supplierService";
import type { Supplier } from "@/types";

const perPage = 8;

function StatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: typeof Building2;
}) {
  return (
    <div className="rounded-lg bg-[#f8f7f3] p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#ff6a3d] shadow-sm">
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

function DistributorRow({
  supplier,
  isDeleting,
  onDelete
}: {
  supplier: Supplier;
  isDeleting: boolean;
  onDelete: (supplier: Supplier) => void;
}) {
  return (
    <tr className="group border-t border-stone-100 transition hover:bg-[#f8f7f3]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <Truck className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-[#20201d]">{supplier.nama}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-stone-400">
              {supplier.kode ? `Kode: ${supplier.kode}` : supplier.npwp ? `NPWP: ${supplier.npwp}` : "-"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-600">
          <UserRound className="h-4 w-4 shrink-0 text-stone-400" strokeWidth={1.9} />
          <span className="truncate">{supplier.kontakPerson || "-"}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-600">
          <Phone className="h-4 w-4 shrink-0 text-stone-400" strokeWidth={1.9} />
          <span>{supplier.telepon || "-"}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-600">
          <Mail className="h-4 w-4 shrink-0 text-stone-400" strokeWidth={1.9} />
          <span className="truncate">{supplier.email || "-"}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge variant={supplier.aktif ? "success" : "muted"}>
          {supplier.aktif ? "Aktif" : "Nonaktif"}
        </Badge>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-1">
          <Link
            href={`/supplier/${supplier.id}`}
            aria-label="Detail distributor"
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
          >
            <Eye className="h-4 w-4" strokeWidth={1.9} />
          </Link>
          <Link
            href={`/supplier/${supplier.id}/edit`}
            aria-label="Edit distributor"
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.9} />
          </Link>
          <button
            type="button"
            aria-label={`Hapus ${supplier.nama}`}
            disabled={isDeleting}
            onClick={() => onDelete(supplier)}
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function SupplierListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function handleDelete(supplier: Supplier) {
    const confirmed = window.confirm(
      `Hapus distributor "${supplier.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setDeletingId(supplier.id);
    try {
      await supplierService.delete(supplier.id);
      setRows((current) => current.filter((row) => row.id !== supplier.id));
      setTotal((current) => Math.max(0, current - 1));
      toast.success(`Distributor "${supplier.nama}" berhasil dihapus`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus distributor"
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const result = await supplierService.list({ search, page, perPage });
        if (!active) return;
        setRows(result.data);
        setTotal(result.total);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat data distributor"
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [page, search]);

  const stats = useMemo(() => {
    const activeCount = rows.filter((s) => s.aktif).length;
    const withContact = rows.filter((s) => s.telepon || s.email).length;
    return { activeCount, withContact };
  }, [rows]);

  return (
    <>
      <Header
        title="Distributor"
        description="Daftar distributor/supplier pengadaan barang."
        action={
          <Link
            href="/supplier/tambah"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
          >
            <Plus className="h-4 w-4" />
            Tambah Distributor
          </Link>
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total distributor" value={total} icon={Building2} />
          <StatCard label="Distributor aktif" value={stats.activeCount} icon={Truck} />
          <StatCard label="Ada kontak" value={stats.withContact} icon={Mail} />
        </div>

        {/* Search */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, kontak, telepon, email..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
            />
          </div>
          <p className="text-sm font-semibold text-stone-500">{total} distributor ditemukan</p>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Distributor</th>
                  <th className="px-5 py-4">Kontak</th>
                  <th className="px-5 py-4">Telepon</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-stone-400">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-8 w-8 animate-pulse text-stone-300" />
                        Memuat data distributor...
                      </div>
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((supplier) => (
                    <DistributorRow
                      key={supplier.id}
                      supplier={supplier}
                      isDeleting={deletingId === supplier.id}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-stone-400">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-8 w-8 text-stone-200" />
                        Belum ada distributor.{" "}
                        <Link href="/supplier/tambah" className="text-[#0f766e] underline">
                          Tambah sekarang
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-stone-500">
            Halaman {page} dari {totalPages}
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </>
  );
}
