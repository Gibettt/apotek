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
  Truck,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { supplierService } from "@/services/supplierService";
import type { Supplier } from "@/types";

const perPage = 8;

function SupplierStat({
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
          <p className="text-2xl font-black leading-none text-[#20201d]">
            {value}
          </p>
          <p className="mt-1 text-xs font-bold text-stone-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SupplierRow({ supplier }: { supplier: Supplier }) {
  return (
    <tr className="group border-t border-stone-100 transition hover:bg-[#f8f7f3]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <Truck className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-[#20201d]">
              {supplier.namaSupplier}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-stone-400">
              NPWP {supplier.npwp || "-"}
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
        <Badge variant={supplier.status ? "success" : "muted"}>
          {supplier.status ? "Aktif" : "Nonaktif"}
        </Badge>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-1">
          <Link
            href={`/supplier/${supplier.id}`}
            aria-label="Detail supplier"
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
          >
            <Eye className="h-4 w-4" strokeWidth={1.9} />
          </Link>
          <Link
            href={`/supplier/${supplier.id}/edit`}
            aria-label="Edit supplier"
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.9} />
          </Link>
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
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    let active = true;

    async function loadSuppliers() {
      setIsLoading(true);

      try {
        const result = await supplierService.list({ search, page, perPage });

        if (!active) {
          return;
        }

        setRows(result.data);
        setTotal(result.total);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat data supplier"
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSuppliers();

    return () => {
      active = false;
    };
  }, [page, search]);

  const stats = useMemo(() => {
    const activeCount = rows.filter((supplier) => supplier.status).length;
    const completeContacts = rows.filter(
      (supplier) => supplier.telepon && supplier.email
    ).length;

    return { activeCount, completeContacts };
  }, [rows]);

  return (
    <>
      <Header
        title="Supplier"
        description="Pemasok obat dan kontak pembelian."
        action={
          <Link
            href="/supplier/tambah"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Link>
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <div className="grid gap-3 md:grid-cols-3">
          <SupplierStat label="Total supplier" value={total} icon={Building2} />
          <SupplierStat label="Supplier aktif" value={stats.activeCount} icon={Truck} />
          <SupplierStat
            label="Kontak lengkap"
            value={stats.completeContacts}
            icon={Mail}
          />
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
              placeholder="Cari supplier, kontak, telepon, email..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            />
          </div>

          <p className="text-sm font-semibold text-stone-500">
            {total} data supplier ditemukan
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Supplier</th>
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
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Memuat data supplier...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((supplier) => (
                    <SupplierRow key={supplier.id} supplier={supplier} />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Belum ada supplier yang cocok.
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
