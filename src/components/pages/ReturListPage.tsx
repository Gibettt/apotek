"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  PackageMinus,
  Plus,
  ReceiptText,
  Search,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { returPembelianService } from "@/services/returPembelianService";
import type { ReturPembelian, StatusRetur } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

const perPage = 8;

const statusMeta: Record<StatusRetur, { label: string; variant: "success" | "warning" | "danger" | "muted" }> = {
  draft: { label: "Draft", variant: "warning" },
  posted: { label: "Posted", variant: "success" },
  dibatalkan: { label: "Dibatalkan", variant: "danger" }
};

function ReturStat({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
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

function ReturRow({
  item,
  onPost,
  isPosting
}: {
  item: ReturPembelian;
  onPost: (item: ReturPembelian) => void;
  isPosting: boolean;
}) {
  const meta = statusMeta[item.status];

  return (
    <tr className="group border-t border-stone-100 transition hover:bg-[#f8f7f3]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <ReceiptText className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-[#20201d]">{item.nomor}</p>
            <p className="mt-1 truncate text-xs font-semibold text-stone-400">{item.details.length} item retur</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-stone-700">
          <Truck className="h-4 w-4 shrink-0 text-stone-400" strokeWidth={1.9} />
          <span className="truncate">{item.namaSupplier}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-bold text-stone-700">{item.tanggal ? formatDate(item.tanggal) : "-"}</p>
      </td>
      <td className="px-5 py-4">
        <p className="font-black text-[#20201d]">{formatCurrency(item.total)}</p>
      </td>
      <td className="px-5 py-4">
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          {item.status === "draft" ? (
            <button
              type="button"
              disabled={isPosting}
              onClick={() => onPost(item)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:pointer-events-none disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.9} />
              Post
            </button>
          ) : null}
          <Link
            href={`/retur/${item.id}`}
            aria-label="Detail retur"
            className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-950"
          >
            <Eye className="h-4 w-4" strokeWidth={1.9} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function ReturListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ReturPembelian[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [postingId, setPostingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  async function loadRetur() {
    setIsLoading(true);

    try {
      const result = await returPembelianService.list({ search, page, perPage });
      setRows(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat data retur");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRetur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  async function handlePost(item: ReturPembelian) {
    setPostingId(item.id);

    try {
      await returPembelianService.post(item.id);
      toast.success(`${item.nomor} diposting dan stok berkurang`);
      await loadRetur();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memposting retur");
    } finally {
      setPostingId(null);
    }
  }

  const stats = useMemo(() => {
    const posted = rows.filter((item) => item.status === "posted").length;
    const draft = rows.filter((item) => item.status === "draft").length;
    const pageValue = rows.reduce((sum, item) => sum + item.total, 0);

    return { posted, draft, pageValue };
  }, [rows]);

  return (
    <>
      <Header
        title="Retur Pembelian"
        description="Pengembalian barang ke supplier, item keluar, dan update stok saat diposting."
        action={
          <Link
            href="/retur/tambah"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,118,110,.18)] transition hover:-translate-y-0.5 hover:bg-[#115e59]"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Link>
        }
      />

      <section className="dashboard-surface">
        <div className="grid gap-3 md:grid-cols-4">
          <ReturStat label="Total Retur" value={total} icon={FilePlus2} />
          <ReturStat label="Posted" value={stats.posted} icon={PackageMinus} />
          <ReturStat label="Draft" value={stats.draft} icon={Clock3} />
          <ReturStat label="Nilai halaman" value={formatCurrency(stats.pageValue)} icon={ReceiptText} />
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
              placeholder="Cari nomor, supplier, status..."
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            />
          </div>

          <p className="text-sm font-semibold text-stone-500">{total} data retur ditemukan</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Nomor</th>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-stone-500">
                      Memuat data retur...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((item) => (
                    <ReturRow key={item.id} item={item} isPosting={postingId === item.id} onPost={handlePost} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-stone-500">
                      Belum ada retur yang cocok.
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </>
  );
}
