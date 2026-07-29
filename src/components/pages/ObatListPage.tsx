"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  Check,
  Eye,
  PackagePlus,
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
import { stokService } from "@/services/stokService";
import type { Obat } from "@/types";
import { stockLabel } from "@/lib/eceran";
import { isLowStock, LOW_STOCK_THRESHOLD } from "@/lib/stockRules";
import { formatCurrency } from "@/utils/formatCurrency";

const QUICK_RESTOCK_QTY = 10;

const perPage = 8;

function getStockState(item: Obat) {
  if (item.stokTersedia <= 0) {
    return {
      label: "Stok habis",
      badge: "danger" as const,
      bar: "bg-red-500",
      bg: "bg-red-50"
    };
  }

  if (isLowStock(item.stokTersedia)) {
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
  onDelete,
  onRestock,
  onSetPrice
}: {
  item: Obat;
  onDelete: (item: Obat) => void;
  onRestock: (item: Obat) => void;
  onSetPrice: (item: Obat) => void;
}) {
  const stock = getStockState(item);
  const progress = Math.min(
    100,
    Math.round((item.stokTersedia / (LOW_STOCK_THRESHOLD * 2)) * 100)
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
              {stockLabel(item)}
            </span>
            <span className="text-xs font-semibold text-stone-400">
              Min {LOW_STOCK_THRESHOLD}
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
          <button
            type="button"
            aria-label={`Tambah stok ${item.nama}`}
            title="Tambah stok"
            onClick={() => onRestock(item)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f8f7f3] text-emerald-700 transition hover:bg-white hover:text-emerald-800 hover:shadow-sm"
          >
            <PackagePlus className="h-4 w-4" strokeWidth={1.9} />
          </button>
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
  const [restockTarget, setRestockTarget] = useState<Obat | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [skipRestockConfirm, setSkipRestockConfirm] = useState(false);
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

  async function doRestock(item: Obat) {
    setIsRestocking(true);

    try {
      await stokService.masuk({
        barangId: item.id,
        qty: QUICK_RESTOCK_QTY,
        keterangan: "Tambah stok cepat dari daftar obat"
      });
      toast.success(`Stok ${item.nama} bertambah ${QUICK_RESTOCK_QTY}`);
      setRestockTarget(null);
      setRefreshToken((token) => token + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambah stok");
    } finally {
      setIsRestocking(false);
    }
  }

  function handleRestockClick(item: Obat) {
    if (skipRestockConfirm) {
      void doRestock(item);
      return;
    }

    setRestockTarget(item);
  }

  async function handleConfirmRestock() {
    if (!restockTarget) return;

    setSkipRestockConfirm(true);
    await doRestock(restockTarget);
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
    const lowItems = rows.filter(
      (item) => isLowStock(item.stokTersedia)
    ).length;

    return { lowItems };
  }, [rows]);

  return (
    <>
      <Header
        title="Stok Barang"
        description="Daftar barang dari Pembelian. Kelola harga jual per barang di sini."
      />

      <section className="dashboard-surface">
        <div className="grid gap-3 md:grid-cols-2">
          <StockStat label="Total barang" value={total} icon={Boxes} />
          <StockStat label="Stok menipis" value={stats.lowItems} icon={AlertTriangle} />
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
                  <th className="w-[196px] px-5 py-4 text-right">Aksi</th>
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
                      onRestock={handleRestockClick}
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
        open={Boolean(restockTarget)}
        title="Tambah Stok"
        onClose={() => setRestockTarget(null)}
      >
        <p className="text-sm font-semibold text-stone-600">
          Yakin ingin menambah stok <strong className="text-stone-950">+{QUICK_RESTOCK_QTY}</strong> untuk{" "}
          <strong className="text-stone-950">{restockTarget?.nama}</strong>?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isRestocking}
            onClick={() => setRestockTarget(null)}
          >
            <X className="h-4 w-4" />
            Batal
          </Button>
          <Button type="button" isLoading={isRestocking} onClick={handleConfirmRestock}>
            <Check className="h-4 w-4" />
            Ya, Tambah Stok
          </Button>
        </div>
      </Modal>

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
