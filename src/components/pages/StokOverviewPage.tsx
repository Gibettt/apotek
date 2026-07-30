"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, CalendarClock, PackageSearch, Ruler } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, type Column } from "@/components/ui/Table";
import { usePagination } from "@/hooks/usePagination";
import { LOW_STOCK_THRESHOLD, isLowStock } from "@/lib/stockRules";
import { obatService } from "@/services/obatService";
import { returPenjualanService } from "@/services/returPenjualanService";
import { stokService } from "@/services/stokService";
import type { Obat, StokBatch } from "@/types";
import { formatDate } from "@/utils/formatDate";

const EXPIRY_WARNING_DAYS = 90;
const UNUSUAL_EXPIRY_YEAR_OFFSET = 20;

type FilterKey = "semua" | "perlu-atensi" | "expired" | "segera" | "tanpa-batch";
type QtyState = "aman" | "menipis" | "habis";
type ExpiryState = "aman" | "segera" | "expired" | "tanpa" | "cek";

interface StockRow extends StokBatch {
  satuanUtama?: string;
}

interface StockRowView {
  row: StockRow;
  normalizedBatch: string;
  qtyState: QtyState;
  expiryState: ExpiryState;
  expiryLabel: string;
  qtyLabel: string;
  daysToExpire: number | null;
  needsAttention: boolean;
}

const filterOptions: Array<{ key: FilterKey; label: string }> = [
  { key: "semua", label: "Semua batch" },
  { key: "perlu-atensi", label: "Perlu atensi" },
  { key: "expired", label: "Sudah expired" },
  { key: "segera", label: "Segera expired" },
  { key: "tanpa-batch", label: "Tanpa batch" }
];

function formatQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value);
}

function parseExpiry(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayDiff(date: Date) {
  const millisPerDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / millisPerDay);
}

function getExpiryState(expiry?: string): Pick<StockRowView, "expiryState" | "expiryLabel" | "daysToExpire"> {
  const date = parseExpiry(expiry);

  if (!expiry || !date) {
    return {
      expiryState: "tanpa",
      expiryLabel: "Belum ada tanggal",
      daysToExpire: null
    };
  }

  const currentYear = new Date().getFullYear();

  if (date.getFullYear() > currentYear + UNUSUAL_EXPIRY_YEAR_OFFSET) {
    return {
      expiryState: "cek",
      expiryLabel: "Cek ulang tanggal",
      daysToExpire: dayDiff(date)
    };
  }

  const days = dayDiff(date);

  if (days < 0) {
    return {
      expiryState: "expired",
      expiryLabel: `Expired ${formatDate(date)}`,
      daysToExpire: days
    };
  }

  if (days <= EXPIRY_WARNING_DAYS) {
    return {
      expiryState: "segera",
      expiryLabel: `${days} hari lagi`,
      daysToExpire: days
    };
  }

  return {
    expiryState: "aman",
    expiryLabel: formatDate(date),
    daysToExpire: days
  };
}

function getQtyState(qty: number): QtyState {
  if (qty <= 0) {
    return "habis";
  }

  if (isLowStock(qty)) {
    return "menipis";
  }

  return "aman";
}

function qtyBadge(state: QtyState) {
  if (state === "habis") {
    return <Badge variant="danger">Habis</Badge>;
  }

  if (state === "menipis") {
    return <Badge variant="warning">Menipis</Badge>;
  }

  return <Badge variant="success">Aman</Badge>;
}

function expiryBadge(state: ExpiryState) {
  if (state === "expired") {
    return <Badge variant="danger">Expired</Badge>;
  }

  if (state === "segera") {
    return <Badge variant="warning">Segera expired</Badge>;
  }

  if (state === "cek") {
    return <Badge variant="info">Periksa tanggal</Badge>;
  }

  if (state === "tanpa") {
    return <Badge variant="muted">Tanpa tanggal</Badge>;
  }

  return <Badge variant="success">Masih aman</Badge>;
}

function buildRowView(row: StockRow): StockRowView {
  const normalizedBatch = row.nomorBatch && row.nomorBatch !== "-" ? row.nomorBatch : "Tanpa batch";
  const qtyState = getQtyState(row.qty);
  const expiry = getExpiryState(row.tanggalExpired);

  return {
    row,
    normalizedBatch,
    qtyState,
    expiryState: expiry.expiryState,
    expiryLabel: expiry.expiryLabel,
    qtyLabel: formatQuantity(row.qty),
    daysToExpire: expiry.daysToExpire,
    needsAttention:
      qtyState !== "aman" ||
      expiry.expiryState === "expired" ||
      expiry.expiryState === "segera" ||
      normalizedBatch === "Tanpa batch"
  };
}

function matchesFilter(item: StockRowView, filter: FilterKey) {
  if (filter === "perlu-atensi") {
    return item.needsAttention;
  }

  if (filter === "expired") {
    return item.expiryState === "expired";
  }

  if (filter === "segera") {
    return item.expiryState === "segera";
  }

  if (filter === "tanpa-batch") {
    return item.normalizedBatch === "Tanpa batch";
  }

  return true;
}

function mergeStockRows(batchRows: StokBatch[], obats: Obat[]): StockRow[] {
  const obatById = Object.fromEntries(obats.map((item) => [item.id, item]));
  const obatIndex = Object.fromEntries(obats.map((item, index) => [item.id, index]));

  const normalizedRows = batchRows
    .filter((row) => Boolean(obatById[row.barangId]))
    .map((row) => {
      const obat = obatById[row.barangId];

      return {
        ...row,
        namaBarang: obat.nama,
        lokasiNama: undefined,
        satuanUtama: obat.satuanNama
      };
    });

  const qtyByBarang = normalizedRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.barangId] = (acc[row.barangId] ?? 0) + row.qty;
    return acc;
  }, {});

  const syntheticRows: Array<StockRow | null> = obats.map((item) => {
    const delta = item.stokTersedia - (qtyByBarang[item.id] ?? 0);
    const hasAnyBatch = normalizedRows.some((row) => row.barangId === item.id);

    if (hasAnyBatch && delta <= 0) {
      return null;
    }

    if (!hasAnyBatch && item.stokTersedia === 0) {
      return {
        id: `synthetic-${item.id}`,
        barangId: item.id,
        namaBarang: item.nama,
        nomorBatch: "-",
        tanggalExpired: undefined,
        qty: 0,
        cabangId: "",
        lokasiSimpanId: item.lokasiDefaultId,
        lokasiNama: undefined,
        satuanUtama: item.satuanNama,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    }

    if (delta > 0) {
      return {
        id: `synthetic-${item.id}`,
        barangId: item.id,
        namaBarang: item.nama,
        nomorBatch: "-",
        tanggalExpired: undefined,
        qty: delta,
        cabangId: "",
        lokasiSimpanId: item.lokasiDefaultId,
        lokasiNama: undefined,
        satuanUtama: item.satuanNama,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    }

    return null;
  });

  return [...normalizedRows, ...syntheticRows.filter((row): row is StockRow => row !== null)].sort((a, b) => {
    const byBarang = (obatIndex[a.barangId] ?? Number.MAX_SAFE_INTEGER) - (obatIndex[b.barangId] ?? Number.MAX_SAFE_INTEGER);

    if (byBarang !== 0) {
      return byBarang;
    }

    if (a.nomorBatch === "-" && b.nomorBatch !== "-") {
      return 1;
    }

    if (a.nomorBatch !== "-" && b.nomorBatch === "-") {
      return -1;
    }

    return a.nomorBatch.localeCompare(b.nomorBatch);
  });
}

export function StokOverviewPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("semua");
  const [rowsData, setRowsData] = useState<StockRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    async function loadData() {
      await returPenjualanService.list({ page: 1, perPage: 1000 });
      const [stockResult, obatResult] = await Promise.all([
        stokService.list({ page: 1, perPage: 1000 }),
        obatService.list({ page: 1, perPage: 1000 })
      ]);

      return { stockResult, obatResult };
    }

    loadData()
      .then(({ stockResult, obatResult }) => {
        if (active) {
          setRowsData(mergeStockRows(stockResult.data, obatResult.data));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const preparedRows = useMemo(() => rowsData.map(buildRowView), [rowsData]);

  const summary = useMemo(() => {
    const totalQty = preparedRows.reduce((sum, item) => sum + item.row.qty, 0);
    const lowStock = preparedRows.filter((item) => item.qtyState === "menipis" || item.qtyState === "habis").length;
    const expired = preparedRows.filter((item) => item.expiryState === "expired").length;
    const expiringSoon = preparedRows.filter((item) => item.expiryState === "segera").length;
    const missingBatch = preparedRows.filter((item) => item.normalizedBatch === "Tanpa batch").length;

    return { totalQty, lowStock, expired, expiringSoon, missingBatch };
  }, [preparedRows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return preparedRows.filter((item) => {
      const matchText =
        !normalizedSearch ||
        [item.row.namaBarang, item.normalizedBatch, item.row.satuanUtama, item.expiryLabel]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchText && matchesFilter(item, filter);
    });
  }, [filter, preparedRows, search]);

  const pagination = usePagination(filteredRows.length, 8);
  const rows = filteredRows.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage
  );

  const columns: Column<StockRowView>[] = [
    {
      key: "obat",
      header: "Obat",
      cell: (item) => (
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">{item.row.namaBarang}</p>
          <p className="text-xs text-slate-500">ID stok {item.row.id.slice(0, 8)}</p>
        </div>
      )
    },
    {
      key: "satuan",
      header: "Satuan",
      cell: (item) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-800">{item.row.satuanUtama ?? "-"}</p>
          <p className="text-xs text-slate-500">Diambil dari master barang</p>
        </div>
      ),
      className: "w-40"
    },
    {
      key: "batch",
      header: "Batch",
      cell: (item) => (
        <div className="space-y-2">
          <p className="font-medium text-slate-800">{item.normalizedBatch}</p>
          <div className="flex flex-wrap gap-2">
            {item.normalizedBatch === "Tanpa batch" ? <Badge variant="muted">Perlu dilengkapi</Badge> : null}
            {qtyBadge(item.qtyState)}
          </div>
        </div>
      )
    },
    {
      key: "expired",
      header: "Expired",
      cell: (item) => (
        <div className="space-y-2">
          <p className="font-medium text-slate-800">
            {item.row.tanggalExpired ? formatDate(item.row.tanggalExpired) : "-"}
          </p>
          <div className="flex flex-wrap gap-2">
            {expiryBadge(item.expiryState)}
          </div>
          <p className="text-xs text-slate-500">{item.expiryLabel}</p>
        </div>
      )
    },
    {
      key: "jumlah",
      header: "Jumlah",
      cell: (item) => (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900">{item.qtyLabel}</p>
          <p className="text-xs text-slate-500">
            {item.row.satuanUtama ?? "Satuan belum diisi"}
          </p>
          <p className="text-xs text-slate-500">
            {item.qtyState === "habis"
              ? "Perlu isi ulang"
              : item.qtyState === "menipis"
                ? `Di bawah batas ${LOW_STOCK_THRESHOLD}`
                : "Stok aman"}
          </p>
        </div>
      ),
      className: "w-40"
    }
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Stok"
        description="Pantau stok berdasarkan master barang, lalu lengkapi dengan info batch, satuan, dan tanggal expired."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/stok/masuk">
              <Button variant="secondary">
                Stok Masuk
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,#0f766e,#134e4a)] text-white shadow-[0_24px_70px_rgba(15,118,110,0.22)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/15 p-3">
                <Boxes className="h-5 w-5" />
              </span>
              <Badge className="bg-white/15 text-white ring-white/20">Ringkasan</Badge>
            </div>
            <div>
              <p className="text-sm text-white/80">Total unit tersimpan</p>
              <p className="mt-1 text-3xl font-semibold">{formatQuantity(summary.totalQty)}</p>
            </div>
            <p className="text-sm text-white/75">Menggabungkan semua batch yang sedang aktif di stok.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <span className="inline-flex rounded-full bg-amber-50 p-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Stok menipis / habis</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{summary.lowStock}</p>
            </div>
            <p className="text-sm text-slate-500">Prioritaskan refill untuk item di bawah batas minimum.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <span className="inline-flex rounded-full bg-red-50 p-3 text-red-700">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Expired / segera expired</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">
                {summary.expired + summary.expiringSoon}
              </p>
            </div>
            <p className="text-sm text-slate-500">
              {summary.expired} expired, {summary.expiringSoon} dalam {EXPIRY_WARNING_DAYS} hari.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <span className="inline-flex rounded-full bg-sky-50 p-3 text-sky-700">
              <Ruler className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Barang tanpa batch</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{summary.missingBatch}</p>
            </div>
            <p className="text-sm text-slate-500">Satuan tetap mengikuti data barang walau batch belum lengkap.</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader title="Daftar stok barang">
          <div className="flex flex-wrap gap-2">
            <Link href="/stok/hampir-habis">
              <Button variant="ghost" size="sm">Lihat stok menipis</Button>
            </Link>
            <Link href="/stok/expired">
              <Button variant="ghost" size="sm">Lihat expired</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                pagination.setPage(1);
              }}
              placeholder="Cari nama obat, batch, satuan, atau status expired..."
            />
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setFilter(option.key);
                    pagination.setPage(1);
                  }}
                  className={[
                    "rounded-full border px-3 py-2 text-sm font-medium transition",
                    filter === option.key
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white p-2 text-brand-700 shadow-sm">
                  <PackageSearch className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {filteredRows.length} batch cocok dengan filter saat ini
                  </p>
                  <p className="text-xs text-slate-500">
                    Fokuskan perhatian pada badge merah dan kuning untuk tindak lanjut cepat.
                  </p>
                </div>
              </div>
              <Badge variant={filter === "semua" ? "info" : "warning"}>
                Filter: {filterOptions.find((option) => option.key === filter)?.label}
              </Badge>
            </div>
          </div>

          <Table
            columns={columns}
            data={rows}
            emptyText={isLoading ? "Memuat data stok..." : "Tidak ada batch yang cocok dengan filter"}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
