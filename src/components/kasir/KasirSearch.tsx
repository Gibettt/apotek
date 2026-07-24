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

  if (item.stokTersedia < item.stokMinimum) {
    return { label: "Menipis", variant: "warning" as const };
  }

  return { label: "Siap jual", variant: "success" as const };
}

function getDisabledReason(item: ObatListItem, cartQuantity: number) {
  if (!item.status) {
    return "Nonaktif";
  }

  if (item.stokTersedia <= 0) {
    return "Stok habis";
  }

  if (item.membutuhkanResep) {
    return "Butuh resep";
  }

  if (cartQuantity >= item.stokTersedia) {
    return "Maksimal";
  }

  return null;
}

export function KasirSearch({ refreshToken }: { refreshToken?: number } = {}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ObatListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  const cartQuantityById = useMemo(
    () =>
      cartItems.reduce<Record<string, number>>((acc, item) => {
        acc[item.barangId] = item.quantity;
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

  useEffect(() => {
    let active = true;

    async function loadObat() {
      setIsLoading(true);

      try {
        const result = await obatService.list({
          search: query,
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
  }, [query, refreshToken]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau kode obat"
            className="h-12 w-full rounded-lg border border-stone-200 bg-white pl-11 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#ff6a3d] focus:ring-4 focus:ring-[#ff6a3d]/10"
          />
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
            const cartQuantity = cartQuantityById[item.id] ?? 0;
            const disabledReason = getDisabledReason(item, cartQuantity);

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
                        Stok {item.stokTersedia}
                      </span>
                      <span className="rounded-full bg-[#f8f7f3] px-3 py-1">
                        Di keranjang {cartQuantity}
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
                  </div>
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
