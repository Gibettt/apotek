"use client";

import {
  Loader2,
  PackageSearch,
  Pill,
  Plus,
  Search,
  ShoppingCart
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { stockLabel, stockQtyForSale, formatMixedStock } from "@/lib/eceran";
import { isLowStock } from "@/lib/stockRules";
import { kategoriService, type MasterOption } from "@/services/kategoriService";
import { obatService, type ObatListItem } from "@/services/obatService";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/formatCurrency";

const perPage = 12;

function getStockBadge(item: ObatListItem) {
  if (!item.status) {
    return { label: "Nonaktif", variant: "muted" as const };
  }

  if (item.stokTersedia <= 0) {
    return { label: "Stok habis", variant: "danger" as const };
  }

  if (isLowStock(item.stokTersedia)) {
    return { label: "Menipis", variant: "warning" as const };
  }

  return { label: "Siap jual", variant: "success" as const };
}

function getDisabledReason(
  item: ObatListItem,
  cartStockQuantity: number,
  stockQtyPerUnit = 1
) {
  if (!item.status) {
    return "Nonaktif";
  }

  if (item.stokTersedia <= 0) {
    return "Stok habis";
  }

  if (cartStockQuantity + stockQtyPerUnit > item.stokTersedia) {
    return "Maksimal";
  }

  return null;
}

export function KasirSearch({
  refreshToken,
  onTotalChange
}: {
  refreshToken?: number;
  onTotalChange?: (total: number) => void;
} = {}) {
  const [query, setQuery] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [kategoriOptions, setKategoriOptions] = useState<MasterOption[]>([]);
  const [results, setResults] = useState<ObatListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const trimmedQuery = query.trim();

  const cartStockQuantityById = useMemo(
    () =>
      cartItems.reduce<Record<string, number>>((acc, item) => {
        acc[item.barangId] =
          (acc[item.barangId] ?? 0) +
          stockQtyForSale(item.quantity, item.stockQtyPerUnit ?? 1);
        return acc;
      }, {}),
    [cartItems]
  );

  const readyCount = useMemo(
    () =>
      results.filter(
        (item) => item.status && item.stokTersedia > 0
      ).length,
    [results]
  );
  const categoryMenuOptions = useMemo(
    () => [{ id: "", label: "Semua kategori" }, ...kategoriOptions],
    [kategoriOptions]
  );
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasNextPage = page < totalPages;

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
        const result = await obatService.list({
          ...(trimmedQuery ? { search: trimmedQuery } : {}),
          ...(kategoriId ? { kategoriId } : {}),
          page,
          perPage
        });

        if (!active) {
          return;
        }

        setResults(result.data);
        setTotal(result.total);
        onTotalChange?.(result.total);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat obat kasir"
          );
          setResults([]);
          setTotal(0);
          onTotalChange?.(0);
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
  }, [trimmedQuery, kategoriId, page, refreshToken, onTotalChange]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89918c]" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Ketik nama atau kode obat"
            className="h-11 w-full rounded-full border border-[#e1e6e3] bg-white pl-11 pr-4 text-sm font-bold text-[#37413b] outline-none transition placeholder:text-[#a0a8a3] focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm md:w-[190px]">
          <div className="rounded-[12px] border border-[#e6eae7] bg-[#fdfefd] px-3 py-2">
            <p className="text-[11px] font-bold text-stone-400">Ditemukan</p>
            <p className="mt-1 font-black text-[#2d3832]">{total}</p>
          </div>
          <div className="rounded-[12px] bg-[#247967] px-3 py-2">
            <p className="text-[11px] font-bold text-white/65">Siap</p>
            <p className="mt-1 font-black text-white">{readyCount}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categoryMenuOptions.map((option) => {
          const selected = option.id === kategoriId;

          return (
            <button
              key={option.id || "all"}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setKategoriId(option.id);
                setPage(1);
              }}
              className={`h-8 shrink-0 rounded-full px-4 text-xs font-black transition ${
                selected
                  ? "bg-[#dcf1e7] text-[#1c6e5b] shadow-[0_10px_20px_rgba(36,121,103,0.12)]"
                  : "bg-[#f3f7f5] text-[#59635d] hover:bg-[#eef3f0]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full grid place-items-center rounded-[14px] border border-dashed border-[#d7dfda] bg-[#fafcfb] px-4 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#267d6b]" />
            <p className="mt-3 text-sm font-bold text-stone-500">
              Memuat obat dari Supabase...
            </p>
          </div>
        ) : results.length ? (
          results.map((item) => {
            const stockBadge = getStockBadge(item);
            const cartStockQuantity = cartStockQuantityById[item.id] ?? 0;
            const disabledReason = getDisabledReason(item, cartStockQuantity);
            const eceranStockQty = item.eceran
              ? 1 / item.eceran.isiPerSatuan
              : 1;
            const disabledEceranReason = item.eceran
              ? getDisabledReason(item, cartStockQuantity, eceranStockQty)
              : null;

            return (
              <div
                key={item.id}
                className="rounded-[14px] border border-[#e6eae7] bg-white p-2 shadow-[0_12px_28px_rgba(50,75,63,0.06)] transition hover:-translate-y-0.5 hover:border-[#9bcbbb] hover:shadow-[0_16px_34px_rgba(42,121,103,0.1)]"
              >
                <div className="grid min-h-[116px] grid-cols-[96px_minmax(0,1fr)] gap-3">
                  <div
                    className="grid h-24 w-24 place-items-center rounded-[12px] bg-[#eef3f0] bg-cover bg-center text-[#267d6b]"
                    style={
                      item.gambarUrl
                        ? { backgroundImage: `url(${item.gambarUrl})` }
                        : undefined
                    }
                  >
                    {!item.gambarUrl ? <Pill className="h-9 w-9" strokeWidth={1.8} /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-black text-[#2d3832]">{item.nama}</p>
                      <p className="shrink-0 text-xs font-black text-[#2d3832]">
                        {formatCurrency(item.hargaAktif?.hargaJual ?? 0)}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-bold text-stone-400">
                      {item.kategoriNama || "Tanpa kategori"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-stone-500">
                      <span className="rounded-full bg-[#eef3f0] px-2 py-1">
                        Stok {stockLabel(item)}
                      </span>
                      <span className="rounded-full bg-[#eef3f0] px-2 py-1">
                        Di keranjang{" "}
                        {formatMixedStock(
                          cartStockQuantity,
                          item.eceran?.isiPerSatuan,
                          item.satuanNama || "item",
                          item.eceran?.satuanNama
                        )}
                      </span>
                      <Badge variant={stockBadge.variant}>{stockBadge.label}</Badge>
                      {item.membutuhkanResep ? <Badge variant="info">Resep</Badge> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-100 pt-2">
                  <p className="truncate text-[11px] font-bold text-stone-500">
                    {item.kode} - {item.satuanNama || "item"}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.eceran ? (
                      <button
                        type="button"
                        aria-label={`Tambah eceran ${item.nama}`}
                        disabled={Boolean(disabledEceranReason)}
                        onClick={() =>
                          item.eceran &&
                          addItem(item, {
                            satuanId: item.eceran.satuanId,
                            satuanNama: item.eceran.satuanNama,
                            tipeHarga: "eceran",
                            stockQtyPerUnit: eceranStockQty,
                            hargaJual: item.eceran.hargaJual
                          })
                        }
                        className="grid h-8 min-w-8 place-items-center rounded-full bg-[#e7f0fb] px-2 text-[10px] font-black text-[#3468b0] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:bg-stone-100 disabled:text-stone-400"
                      >
                        {disabledEceranReason ? disabledEceranReason : "Eceran"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Tambah ${item.nama}`}
                      disabled={Boolean(disabledReason)}
                      onClick={() => addItem(item)}
                      className="grid h-8 min-w-8 place-items-center rounded-full bg-[#247967] px-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#1c6e5b] disabled:pointer-events-none disabled:bg-stone-100 disabled:text-stone-400"
                    >
                      {disabledReason ? (
                        disabledReason
                      ) : (
                        <Plus className="h-4 w-4" strokeWidth={2.2} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full grid place-items-center rounded-[14px] border border-dashed border-[#d7dfda] bg-[#fafcfb] px-4 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#55605a] shadow-sm">
              {query ? (
                <PackageSearch className="h-6 w-6" strokeWidth={1.9} />
              ) : (
                <ShoppingCart className="h-6 w-6" strokeWidth={1.9} />
              )}
            </span>
            <p className="mt-4 text-sm font-black text-[#2d3832]">
              {trimmedQuery ? "Obat tidak ditemukan" : "Belum ada obat aktif"}
            </p>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-stone-500">
              {trimmedQuery
                ? "Coba cari dengan kode atau nama lain."
                : "Data produk akan muncul di sini setelah tersedia di Supabase."}
            </p>
          </div>
        )}
      </div>

      {results.length ? (
        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e6eae7] bg-[#fdfefd] p-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="h-10 rounded-full bg-white px-4 text-xs font-black text-[#59635d] transition hover:bg-[#eef3f0] disabled:pointer-events-none disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs font-black text-[#59635d]">
            Halaman {page} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={!hasNextPage || isLoading}
            onClick={() => setPage((current) => current + 1)}
            className="h-10 rounded-full bg-[#247967] px-5 text-xs font-black text-white transition hover:bg-[#1c6e5b] disabled:pointer-events-none disabled:bg-white disabled:text-[#9aa39d]"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
