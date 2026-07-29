"use client";

import {
  ChevronDown,
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

const perPage = 8;

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

  if (item.membutuhkanResep) {
    return "Butuh resep";
  }

  if (cartStockQuantity + stockQtyPerUnit > item.stokTersedia) {
    return "Maksimal";
  }

  return null;
}

export function KasirSearch({ refreshToken }: { refreshToken?: number } = {}) {
  const [query, setQuery] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [kategoriOptions, setKategoriOptions] = useState<MasterOption[]>([]);
  const [results, setResults] = useState<ObatListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

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
        (item) =>
          item.status && item.stokTersedia > 0 && !item.membutuhkanResep
      ).length,
    [results]
  );
  const categoryMenuOptions = useMemo(
    () => [{ id: "", label: "Semua kategori" }, ...kategoriOptions],
    [kategoriOptions]
  );
  const selectedKategoriLabel =
    categoryMenuOptions.find((option) => option.id === kategoriId)?.label ??
    "Semua kategori";
  const [isKategoriOpen, setIsKategoriOpen] = useState(false);

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
          search: query,
          ...(kategoriId ? { kategoriId } : {}),
          perPage
        });

        if (!active) {
          return;
        }

        setResults(result.data);
        setTotal(result.total);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat obat kasir"
          );
          setResults([]);
          setTotal(0);
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
  }, [query, kategoriId, refreshToken]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau kode obat"
            className="h-12 w-full rounded-lg border border-stone-200 bg-white pl-11 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
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
            className="flex h-12 w-full items-center justify-between gap-3 rounded-lg border border-[#ff6a3d]/45 bg-white px-4 text-left text-sm font-black text-[#20201d] shadow-[0_10px_24px_rgba(255,106,61,.12)] outline-none transition hover:-translate-y-0.5 hover:border-[#ff6a3d] focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
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
        <div className="grid grid-cols-2 gap-2 text-sm md:w-[220px]">
          <div className="rounded-lg bg-[#f8f7f3] px-3 py-2">
            <p className="text-xs font-bold text-stone-400">Ditemukan</p>
            <p className="mt-1 font-black text-[#20201d]">{total}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <p className="text-xs font-bold text-emerald-600">Siap</p>
            <p className="mt-1 font-black text-emerald-700">{readyCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="grid place-items-center rounded-lg border border-dashed border-stone-200 bg-[#f8f7f3] px-4 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#ff6a3d]" />
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
                className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_18px_44px_rgba(25,24,21,.08)] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
                    <Pill className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-black text-[#20201d]">
                        {item.nama}
                      </p>
                      <Badge variant={stockBadge.variant}>
                        {stockBadge.label}
                      </Badge>
                      {item.membutuhkanResep ? (
                        <Badge variant="info">Resep</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-stone-500">
                      {item.kode} - {item.satuanNama || "item"} -{" "}
                      {item.kategoriNama || "Tanpa kategori"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                      <span className="rounded-full bg-[#f8f7f3] px-3 py-1">
                        Stok {stockLabel(item)}
                      </span>
                      <span className="rounded-full bg-[#f8f7f3] px-3 py-1">
                        Di keranjang{" "}
                        {formatMixedStock(
                          cartStockQuantity,
                          item.eceran?.isiPerSatuan,
                          item.satuanNama || "item",
                          item.eceran?.satuanNama
                        )}
                      </span>
                      <span className="rounded-full bg-[#f8f7f3] px-3 py-1">
                        {item.golonganNama || "Tanpa golongan"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:min-w-[184px] sm:flex-col sm:items-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-bold text-stone-400">Harga</p>
                    <p className="text-lg font-black text-[#20201d]">
                      {formatCurrency(item.hargaAktif?.hargaJual ?? 0)}
                    </p>
                    {item.eceran ? (
                      <p className="mt-1 text-xs font-bold text-emerald-700">
                        {formatCurrency(item.eceran.hargaJual)} /{" "}
                        {item.eceran.satuanNama ?? "eceran"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
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
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(15,118,110,.16)] transition hover:-translate-y-0.5 hover:bg-[#115e59] disabled:pointer-events-none disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none"
                      >
                        {disabledEceranReason ? (
                          disabledEceranReason
                        ) : (
                          <>
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            Eceran
                          </>
                        )}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Tambah ${item.nama}`}
                      disabled={Boolean(disabledReason)}
                      onClick={() => addItem(item)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#20201d] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(25,24,21,.16)] transition hover:-translate-y-0.5 hover:bg-black disabled:pointer-events-none disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none"
                    >
                      {disabledReason ? (
                        disabledReason
                      ) : (
                        <>
                          <Plus className="h-4 w-4" strokeWidth={2} />
                          Tambah
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid place-items-center rounded-lg border border-dashed border-stone-200 bg-[#f8f7f3] px-4 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-stone-500 shadow-sm">
              {query ? (
                <PackageSearch className="h-6 w-6" strokeWidth={1.9} />
              ) : (
                <ShoppingCart className="h-6 w-6" strokeWidth={1.9} />
              )}
            </span>
            <p className="mt-4 text-sm font-black text-[#20201d]">
              {query ? "Obat tidak ditemukan" : "Belum ada obat untuk dijual"}
            </p>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-stone-500">
              {query
                ? "Coba cari dengan kode atau nama lain."
                : "Tambahkan obat dari menu Stok Obat. Setelah tersimpan di Supabase, obat akan muncul di sini."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
