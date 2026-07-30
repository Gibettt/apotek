"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ChevronDown,
  Check,
  Eye,
  Pencil,
  Pill,
  Search,
  Tag,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { kategoriService, type MasterOption } from "@/services/kategoriService";
import { obatService, toObatUpdatePayload } from "@/services/obatService";
import { returPenjualanService } from "@/services/returPenjualanService";
import type { Obat } from "@/types";
import { isLowStock, LOW_STOCK_THRESHOLD } from "@/lib/stockRules";
import { formatCurrency } from "@/utils/formatCurrency";

const perPage = 8;

function getMasterState(item: Obat) {
  return {
    availabilityLabel: item.status ? "Aktif" : "Nonaktif",
    availabilityBadge: item.status ? ("success" as const) : ("muted" as const),
    stockLabel:
      item.stokTersedia <= 0 ? "Stok habis" : isLowStock(item.stokTersedia) ? "Stok menipis" : "Stok aman",
    stockBadge:
      item.stokTersedia <= 0 ? ("danger" as const) : isLowStock(item.stokTersedia) ? ("warning" as const) : ("info" as const)
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
  onDelete,
  onSetPrice
}: {
  item: Obat;
  onDelete: (item: Obat) => void;
  onSetPrice: (item: Obat) => void;
}) {
  const state = getMasterState(item);

  return (
    <tr className="group border-t border-stone-100 transition hover:bg-[#f8f7f3]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff7ed] text-[#ff6a3d]">
            <Pill className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-[#20201d]">{item.nama}</p>
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
        <div className="space-y-2">
          <p className="font-black text-[#20201d]">
            {item.perluBatch ? "Per batch" : "Tanpa batch"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={item.perluExpired ? "info" : "muted"}>
              {item.perluExpired ? "Pakai expired" : "Tanpa expired"}
            </Badge>
            <Badge variant={item.membutuhkanResep ? "warning" : "muted"}>
              {item.membutuhkanResep ? "Butuh resep" : "Bebas"}
            </Badge>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        {item.hargaAktif?.hargaJual ? (
          <>
            <p className="font-black text-[#20201d]">
              {formatCurrency(item.hargaAktif.hargaJual)}
            </p>
            <p className="mt-1 text-xs font-semibold text-stone-400">
              Beli {formatCurrency(item.hargaAktif?.hargaBeli ?? 0)}
            </p>
            {item.eceran ? (
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Eceran {formatCurrency(item.eceran.hargaJual)} /{" "}
                {item.eceran.satuanNama ?? "eceran"}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-stone-400">
              Beli {formatCurrency(item.hargaAktif?.hargaBeli ?? 0)}
            </p>
            <button
              type="button"
              onClick={() => onSetPrice(item)}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 transition hover:bg-amber-100"
            >
              <Tag className="h-3 w-3" strokeWidth={2} />
              Atur harga jual
            </button>
          </>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={state.availabilityBadge}>{state.availabilityLabel}</Badge>
          <Badge variant={state.stockBadge}>{state.stockLabel}</Badge>
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
  const [kategoriId, setKategoriId] = useState("");
  const [kategoriOptions, setKategoriOptions] = useState<MasterOption[]>([]);
  const [isKategoriOpen, setIsKategoriOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Obat[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [priceTarget, setPriceTarget] = useState<Obat | null>(null);
  const [priceValue, setPriceValue] = useState("0");
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const categoryMenuOptions = useMemo(
    () => [{ id: "", label: "Semua kategori" }, ...kategoriOptions],
    [kategoriOptions]
  );
  const selectedKategoriLabel =
    categoryMenuOptions.find((option) => option.id === kategoriId)?.label ??
    "Semua kategori";

  function handleSetPriceClick(item: Obat) {
    setPriceTarget(item);
    setPriceValue(String(item.hargaAktif?.hargaJual ?? 0));
  }

  async function handleSavePrice() {
    if (!priceTarget) return;

    setIsSavingPrice(true);

    try {
      const payload = toObatUpdatePayload(priceTarget, {
        hargaJual: Number(priceValue || 0)
      });
      await obatService.update(priceTarget.id, payload);
      toast.success(`Harga jual ${priceTarget.nama} berhasil disimpan`);
      setPriceTarget(null);
      setRefreshToken((token) => token + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan harga jual"
      );
    } finally {
      setIsSavingPrice(false);
    }
  }

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

    async function loadKategori() {
      try {
        const options = await kategoriService.listOptions();

        if (active) {
          setKategoriOptions(options);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat kategori"
          );
          setKategoriOptions([]);
        }
      }
    }

    void loadKategori();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadObat() {
      setIsLoading(true);

      try {
        await returPenjualanService.list({ page: 1, perPage: 1000 });
        const result = await obatService.list({
          search,
          ...(kategoriId ? { kategoriId } : {}),
          page,
          perPage
        });

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
  }, [page, search, kategoriId, refreshToken]);

  const stats = useMemo(() => {
    const activeItems = rows.filter((item) => item.status).length;
    const lowItems = rows.filter(
      (item) => isLowStock(item.stokTersedia)
    ).length;
    const recipeItems = rows.filter((item) => item.membutuhkanResep).length;

    return { activeItems, lowItems, recipeItems };
  }, [rows]);

  return (
    <>
      <Header
        title="Master Barang"
        description="Kelola data induk obat dan barang: nama, kategori, golongan, satuan, aturan batch, dan harga jual."
      />

      <section className="dashboard-surface">
        <div className="grid gap-3 md:grid-cols-3">
          <StockStat label="Total barang" value={total} icon={Pill} />
          <StockStat label="Barang aktif" value={stats.activeItems} icon={Check} />
          <StockStat label="Perlu resep" value={stats.recipeItems} icon={AlertTriangle} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
          <div className="relative w-full">
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

          <div
            className="relative"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsKategoriOpen(false);
              }
            }}
          >
            <button
              type="button"
              aria-label={`Filter kategori: ${selectedKategoriLabel}`}
              aria-haspopup="listbox"
              aria-expanded={isKategoriOpen}
              onClick={() => setIsKategoriOpen((open) => !open)}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#ff6a3d]/45 bg-white px-4 text-left text-sm font-black text-[#20201d] shadow-[0_10px_24px_rgba(255,106,61,.12)] outline-none transition hover:-translate-y-0.5 hover:border-[#ff6a3d] focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
            >
              <span className="min-w-0 truncate">{selectedKategoriLabel}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#ff6a3d] transition ${
                  isKategoriOpen ? "rotate-180" : ""
                }`}
                strokeWidth={2.2}
              />
            </button>
            {isKategoriOpen ? (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-lg border border-stone-200 bg-white p-1 shadow-[0_18px_44px_rgba(25,24,21,.14)]"
              >
                {categoryMenuOptions.map((option) => {
                  const selected = option.id === kategoriId;

                  return (
                    <button
                      key={option.id || "all"}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setKategoriId(option.id);
                        setPage(1);
                        setIsKategoriOpen(false);
                      }}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-bold transition ${
                        selected
                          ? "bg-[#20201d] text-white"
                          : "text-stone-600 hover:bg-[#fff0ea] hover:text-[#20201d]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <p className="text-sm font-semibold text-stone-500 md:text-right">
            {total} master barang ditemukan
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-4">Barang</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Aturan</th>
                  <th className="px-5 py-4">Harga</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="w-[150px] px-5 py-4 text-right">Aksi</th>
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
                      onSetPrice={handleSetPriceClick}
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

      <Modal
        open={Boolean(priceTarget)}
        title="Atur Harga Jual"
        onClose={() => setPriceTarget(null)}
      >
        <p className="text-sm font-semibold text-stone-600">
          Barang <strong className="text-stone-950">{priceTarget?.nama}</strong> baru
          masuk dari pembelian dan belum punya harga jual.
        </p>
        <p className="mt-1 text-xs font-semibold text-stone-400">
          Harga Beli: {formatCurrency(priceTarget?.hargaAktif?.hargaBeli ?? 0)}
        </p>
        <div className="mt-4">
          <Input
            label="Harga Jual"
            type="number"
            min={0}
            value={priceValue}
            onChange={(event) => setPriceValue(event.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isSavingPrice}
            onClick={() => setPriceTarget(null)}
          >
            <X className="h-4 w-4" />
            Batal
          </Button>
          <Button type="button" isLoading={isSavingPrice} onClick={handleSavePrice}>
            <Check className="h-4 w-4" />
            Simpan Harga
          </Button>
        </div>
      </Modal>
    </>
  );
}
