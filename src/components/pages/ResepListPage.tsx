"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FilePlus2,
  Pill,
  Plus,
  Search,
  Stethoscope,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { resepService } from "@/services/resepService";
import type { Resep, StatusResep } from "@/types";
import { formatDate } from "@/utils/formatDate";

const perPage = 8;

const statusMeta: Record<
  StatusResep,
  { label: string; variant: "success" | "warning" | "danger" | "info" }
> = {
  menunggu: { label: "Menunggu", variant: "warning" },
  diproses: { label: "Diproses", variant: "info" },
  selesai: { label: "Selesai", variant: "success" },
  ditolak: { label: "Ditolak", variant: "danger" }
};

function RecipeStat({
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

function ResepRow({
  item,
  changingId,
  onChangeStatus
}: {
  item: Resep;
  changingId: number | null;
  onChangeStatus: (item: Resep, status: StatusResep) => void;
}) {
  const meta = statusMeta[item.status];
  const isChanging = changingId === item.id;

  return (
    <tr className="group border-t border-stone-100 transition hover:bg-[#f8f7f3]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <ClipboardList className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-[#20201d]">
              {item.nomorResep}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-stone-400">
              {item.details.length} item obat
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[180px] truncate text-sm font-bold text-stone-700">
          {item.namaPelanggan}
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-stone-700">
          <Stethoscope
            className="h-4 w-4 shrink-0 text-stone-400"
            strokeWidth={1.9}
          />
          <span className="max-w-[180px] truncate">{item.namaDokter}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-bold text-stone-700">
          {item.tanggalResep ? formatDate(item.tanggalResep) : "-"}
        </p>
      </td>
      <td className="px-5 py-4">
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          {item.status === "menunggu" ? (
            <button
              type="button"
              disabled={isChanging}
              onClick={() => onChangeStatus(item, "diproses")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-sky-50 px-3 text-xs font-black text-sky-700 transition hover:bg-sky-100 disabled:pointer-events-none disabled:opacity-60"
            >
              <Clock3 className="h-4 w-4" strokeWidth={1.9} />
              Proses
            </button>
          ) : null}
          {item.status === "diproses" ? (
            <button
              type="button"
              disabled={isChanging}
              onClick={() => onChangeStatus(item, "selesai")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:pointer-events-none disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.9} />
              Selesai
            </button>
          ) : null}
          {item.status !== "selesai" && item.status !== "ditolak" ? (
            <button
              type="button"
              aria-label="Tolak resep"
              disabled={isChanging}
              onClick={() => onChangeStatus(item, "ditolak")}
              className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 disabled:pointer-events-none disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" strokeWidth={1.9} />
            </button>
          ) : null}
          <Link
            href={`/resep/${item.id}`}
            aria-label="Detail resep"
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
          >
            <Eye className="h-4 w-4" strokeWidth={1.9} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function ResepListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Resep[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [changingId, setChangingId] = useState<number | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function loadResep() {
    setIsLoading(true);

    try {
      const result = await resepService.list({ search, page, perPage });
      setRows(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data resep"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);

      try {
        const result = await resepService.list({ search, page, perPage });

        if (!active) {
          return;
        }

        setRows(result.data);
        setTotal(result.total);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat data resep"
          );
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
  }, [page, search]);

  async function handleChangeStatus(item: Resep, nextStatus: StatusResep) {
    setChangingId(item.id);

    try {
      await resepService.updateStatus(item.id, nextStatus);
      toast.success(`${item.nomorResep} diperbarui menjadi ${statusMeta[nextStatus].label}`);
      await loadResep();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui resep"
      );
    } finally {
      setChangingId(null);
    }
  }

  const stats = useMemo(() => {
    const waiting = rows.filter((item) => item.status === "menunggu").length;
    const processing = rows.filter((item) => item.status === "diproses").length;
    const completed = rows.filter((item) => item.status === "selesai").length;
    const totalItems = rows.reduce((sum, item) => sum + item.details.length, 0);

    return { waiting, processing, completed, totalItems };
  }, [rows]);

  return (
    <>
      <Header
        title="Resep"
        description="Verifikasi resep dokter, pantau status proses, dan baca item obat dari Supabase."
        action={
          <Link
            href="/resep/tambah"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Link>
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <div className="grid gap-3 md:grid-cols-4">
          <RecipeStat label="Total resep" value={total} icon={ClipboardList} />
          <RecipeStat label="Menunggu" value={stats.waiting} icon={Clock3} />
          <RecipeStat label="Diproses" value={stats.processing} icon={Pill} />
          <RecipeStat label="Selesai" value={stats.completed} icon={FilePlus2} />
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
              placeholder="Cari nomor, pelanggan, dokter, status..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            />
          </div>

          <p className="text-sm font-semibold text-stone-500">
            {total} resep ditemukan
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Nomor</th>
                  <th className="px-5 py-4">Pelanggan</th>
                  <th className="px-5 py-4">Dokter</th>
                  <th className="px-5 py-4">Tanggal</th>
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
                      Memuat data resep...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((item) => (
                    <ResepRow
                      key={item.id}
                      item={item}
                      changingId={changingId}
                      onChangeStatus={handleChangeStatus}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm font-semibold text-stone-500"
                    >
                      Belum ada resep di Supabase.
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
