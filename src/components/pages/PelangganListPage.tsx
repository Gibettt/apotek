"use client";

import Link from "next/link";
import {
  AlertCircle,
  Eye,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  User,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { pelangganService } from "@/services/pelangganService";
import type { Pelanggan } from "@/types";

const PER_PAGE = 10;

function StatCard({
  icon: Icon,
  label,
  value,
  color = "teal"
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color?: "teal" | "amber" | "violet";
}) {
  const colorMap = {
    teal: "bg-[#ccfbf1] text-[#0d9488]",
    amber: "bg-amber-100 text-amber-600",
    violet: "bg-violet-100 text-violet-600"
  };
  return (
    <div className="rounded-xl bg-[#f8f7f3] p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${colorMap[color]} shadow-sm`}>
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

function PelangganRow({
  pelanggan,
  isDeleting,
  onDelete
}: {
  pelanggan: Pelanggan;
  isDeleting: boolean;
  onDelete: (p: Pelanggan) => void;
}) {
  const jenisKelaminLabel =
    pelanggan.jenisKelamin === "L" ? "L" : pelanggan.jenisKelamin === "P" ? "P" : "-";

  return (
    <tr className="group border-t border-stone-100 transition hover:bg-[#f8f7f3]">
      {/* Nama */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black
              ${pelanggan.jenisKelamin === "P" ? "bg-pink-100 text-pink-600" : "bg-[#ccfbf1] text-[#0d9488]"}`}
          >
            {pelanggan.nama.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-[#20201d]">{pelanggan.nama}</p>
            <p className="mt-0.5 text-xs font-semibold text-stone-400">
              {pelanggan.kode} · {jenisKelaminLabel}
            </p>
          </div>
        </div>
      </td>
      {/* Telepon */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-600">
          <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <span>{pelanggan.telepon || "-"}</span>
        </div>
      </td>
      {/* Email */}
      <td className="hidden px-5 py-3.5 md:table-cell">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-600">
          <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          <span className="truncate">{pelanggan.email || "-"}</span>
        </div>
      </td>
      {/* Alergi */}
      <td className="hidden px-5 py-3.5 lg:table-cell">
        {pelanggan.catatanAlergi ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{pelanggan.catatanAlergi}</span>
          </div>
        ) : (
          <span className="text-xs text-stone-400">-</span>
        )}
      </td>
      {/* Status */}
      <td className="px-5 py-3.5">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={pelanggan.aktif ? "success" : "muted"}>
            {pelanggan.aktif ? "Aktif" : "Nonaktif"}
          </Badge>
          {pelanggan.member && (
            <Badge variant="info">
              <Star className="mr-1 h-3 w-3" />
              Member
            </Badge>
          )}
        </div>
      </td>
      {/* Aksi */}
      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end gap-1">
          <Link
            href={`/pelanggan/${pelanggan.id}`}
            aria-label="Detail pelanggan"
            className="grid h-8 w-8 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-900"
          >
            <Eye className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <Link
            href={`/pelanggan/${pelanggan.id}/edit`}
            aria-label="Edit pelanggan"
            className="grid h-8 w-8 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-900"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <button
            type="button"
            aria-label={`Hapus ${pelanggan.nama}`}
            disabled={isDeleting}
            onClick={() => onDelete(pelanggan)}
            className="grid h-8 w-8 place-items-center rounded-full text-stone-500 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function PelangganListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Pelanggan[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  async function handleDelete(pelanggan: Pelanggan) {
    const confirmed = window.confirm(
      `Hapus pelanggan "${pelanggan.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setDeletingId(pelanggan.id);
    try {
      await pelangganService.delete(pelanggan.id);
      setRows((curr) => curr.filter((r) => r.id !== pelanggan.id));
      setTotal((curr) => Math.max(0, curr - 1));
      toast.success(`Pelanggan "${pelanggan.nama}" berhasil dihapus`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus pelanggan");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    pelangganService
      .list({ search, page, perPage: PER_PAGE })
      .then((result) => {
        if (!active) return;
        setRows(result.data);
        setTotal(result.total);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(
          error instanceof Error ? error.message : "Gagal memuat data pelanggan"
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [page, search]);

  const stats = useMemo(() => ({
    total,
    aktif: rows.filter((r) => r.aktif).length,
    member: rows.filter((r) => r.member).length
  }), [rows, total]);

  return (
    <>
      <Header
        title="Pelanggan"
        description="Daftar pelanggan dan data medis pasien."
        action={
          <Link
            href="/pelanggan/tambah"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
          >
            <Plus className="h-4 w-4" />
            Tambah Pelanggan
          </Link>
        }
      />

      <section className="rounded-xl bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={Users} label="Total pelanggan" value={total} color="teal" />
          <StatCard icon={User} label="Pelanggan aktif" value={stats.aktif} color="teal" />
          <StatCard icon={Star} label="Member" value={stats.member} color="amber" />
        </div>

        {/* Search */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, kode, telepon..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
            />
          </div>
          <p className="text-sm font-semibold text-stone-500">
            {total} pelanggan ditemukan
          </p>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-3.5">Pelanggan</th>
                  <th className="px-5 py-3.5">Telepon</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">Email</th>
                  <th className="hidden px-5 py-3.5 lg:table-cell">Alergi</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <Users className="h-8 w-8 animate-pulse text-stone-300" />
                        <span className="text-sm font-semibold">Memuat data pelanggan...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((p) => (
                    <PelangganRow
                      key={p.id}
                      pelanggan={p}
                      isDeleting={deletingId === p.id}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <Users className="h-8 w-8 text-stone-200" />
                        <span className="text-sm font-semibold">Belum ada pelanggan.</span>
                        <Link
                          href="/pelanggan/tambah"
                          className="mt-1 text-sm font-bold text-[#0f766e] underline"
                        >
                          Tambah pelanggan pertama
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
