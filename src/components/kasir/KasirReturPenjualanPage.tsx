"use client";

import { RotateCcw, Save, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KasirPageShell } from "@/components/kasir/KasirPageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { pelangganService } from "@/services/pelangganService";
import {
  returPenjualanService,
  type ReturablePenjualan
} from "@/services/returPenjualanService";
import { useCabangStore } from "@/store/cabangStore";
import type { Pelanggan, ReturPenjualan } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseNumberInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unitLabel(value?: string) {
  return value?.trim() || "item";
}

export function KasirReturPenjualanPage() {
  const { activeCabangId } = useCabangStore();
  const [pelangganQuery, setPelangganQuery] = useState("");
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(null);
  const [sales, setSales] = useState<ReturablePenjualan[]>([]);
  const [laporanRetur, setLaporanRetur] = useState<ReturPenjualan[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [tanggal, setTanggal] = useState(todayInputValue());
  const [alasan, setAlasan] = useState("");
  const [qtyByDetailId, setQtyByDetailId] = useState<Record<string, string>>({});
  const [isLoadingPelanggan, setIsLoadingPelanggan] = useState(true);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const [pelangganResult, returResult] = await Promise.all([
          pelangganService.list({ perPage: 1000 }),
          returPenjualanService.list({ perPage: 1000 })
        ]);
        if (!active) return;
        const activePelanggan = pelangganResult.data.filter((item) => item.aktif);
        const returableSales = await Promise.all(
          activePelanggan.map((item) => returPenjualanService.salesByPelanggan(item.id))
        );
        if (!active) return;
        setPelanggan(activePelanggan.filter((_, index) => returableSales[index].length));
        setLaporanRetur(returResult.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal memuat data retur");
      } finally {
        if (active) setIsLoadingPelanggan(false);
      }
    }

    void loadInitialData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSales() {
      if (!selectedPelanggan) {
        setSales([]);
        setSelectedSaleId("");
        return;
      }

      setIsLoadingSales(true);
      try {
        const rows = await returPenjualanService.salesByPelanggan(selectedPelanggan.id);
        if (!active) return;
        setSales(rows);
        setSelectedSaleId(rows[0]?.id ?? "");
        setQtyByDetailId({});
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal memuat riwayat penjualan pelanggan");
      } finally {
        if (active) setIsLoadingSales(false);
      }
    }

    void loadSales();
    return () => {
      active = false;
    };
  }, [selectedPelanggan]);

  const filteredPelanggan = useMemo(() => {
    const keyword = pelangganQuery.trim().toLowerCase();
    const list = keyword
      ? pelanggan.filter((item) =>
          [item.nama, item.kode, item.telepon].some((value) =>
            String(value ?? "").toLowerCase().includes(keyword)
          )
        )
      : pelanggan;
    return list.slice(0, 8);
  }, [pelanggan, pelangganQuery]);

  const selectedSale = sales.find((item) => item.id === selectedSaleId) ?? null;
  const selectedItems = selectedSale
    ? selectedSale.details
        .map((detail) => ({
          detail,
          jumlah: parseNumberInput(qtyByDetailId[detail.id] ?? "0")
        }))
        .filter((item) => item.jumlah > 0)
    : [];
  const total = selectedItems.reduce(
    (sum, item) => sum + item.jumlah * item.detail.hargaJual,
    0
  );
  const laporanRows = laporanRetur.flatMap((retur) =>
    retur.details.map((detail) => ({ retur, detail }))
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPelanggan || !selectedSale || !alasan.trim() || !selectedItems.length) {
      toast.error("Lengkapi pelanggan, invoice, alasan, dan qty retur");
      return;
    }

    for (const item of selectedItems) {
      if (item.jumlah > item.detail.sisaRetur) {
        toast.error(`Jumlah retur ${item.detail.namaBarang} melebihi sisa retur (${item.detail.sisaRetur})`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await returPenjualanService.create({
        cabangId: activeCabangId ?? selectedSale.cabangId,
        pelangganId: selectedPelanggan.id,
        penjualanId: selectedSale.id,
        tanggal,
        alasan,
        status: "posted",
        items: selectedItems.map((item) => ({
          penjualanDetailId: item.detail.id,
          penjualanId: selectedSale.id,
          barangId: item.detail.barangId,
          satuanId: item.detail.satuanId,
          jumlah: item.jumlah,
          hargaJual: item.detail.hargaJual
        }))
      });
      toast.success("Retur penjualan tersimpan dan stok dikembalikan");
      setAlasan("");
      setQtyByDetailId({});
      const [rows, returResult] = await Promise.all([
        returPenjualanService.salesByPelanggan(selectedPelanggan.id),
        returPenjualanService.list({ perPage: 1000 })
      ]);
      setSales(rows);
      setSelectedSaleId(rows[0]?.id ?? "");
      setLaporanRetur(returResult.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan retur");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KasirPageShell active="retur">
      <main className="min-h-0 flex-1 overflow-hidden rounded-b-[16px] bg-[#151514]">
        <form
          onSubmit={handleSubmit}
          className="grid h-full min-h-0 gap-2 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]"
        >
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#cbb8ff] p-4">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-white text-[#0f766e]">
                <UserRound className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-black">Pelanggan</p>
                <p className="truncate text-xs font-bold text-[#55458a]">
                  {selectedPelanggan?.nama ?? "Cari nama pelanggan"}
                </p>
              </div>
            </div>

            <label className="relative mb-3 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={pelangganQuery}
                disabled={isLoadingPelanggan}
                onChange={(event) => setPelangganQuery(event.target.value)}
                placeholder={isLoadingPelanggan ? "Memuat pelanggan..." : "Cari nama pelanggan"}
                className="h-12 w-full rounded-[12px] border-0 bg-white pl-11 pr-4 text-sm font-bold outline-none placeholder:text-stone-400 focus:ring-4 focus:ring-white/45"
              />
            </label>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredPelanggan.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedPelanggan(item);
                    setPelangganQuery("");
                  }}
                  className={`flex h-11 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left text-sm font-black transition ${
                    selectedPelanggan?.id === item.id
                      ? "bg-[#1f1f1c] text-white"
                      : "bg-white text-stone-600 hover:text-stone-950"
                  }`}
                >
                  <span className="min-w-0 truncate">{item.nama}</span>
                  <span className="shrink-0 text-xs opacity-65">{item.telepon || item.kode}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#e6f3c4] p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xl font-black">Retur Penjualan</p>
                <p className="text-xs font-bold text-[#59633d]">
                  Pilih pelanggan, invoice, lalu masukkan qty barang retur.
                </p>
              </div>
              <div className="rounded-[16px] bg-[#151514] px-4 py-2 text-right">
                <p className="text-[11px] font-bold text-white/50">Total Refund</p>
                <p className="text-lg font-black text-[#d5eb72]">{formatCurrency(total)}</p>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <Input
                label="Tanggal Retur"
                type="date"
                value={tanggal}
                onChange={(event) => setTanggal(event.target.value)}
                className="rounded-[12px]"
              />
              <Input
                label="Alasan Retur"
                value={alasan}
                onChange={(event) => setAlasan(event.target.value)}
                placeholder="Contoh: barang salah beli"
                className="rounded-[12px]"
              />
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {isLoadingSales ? (
                <div className="rounded-[14px] bg-white px-4 py-3 text-sm font-bold text-stone-500">
                  Memuat riwayat penjualan...
                </div>
              ) : sales.length ? (
                sales.map((sale) => (
                  <button
                    key={sale.id}
                    type="button"
                    onClick={() => {
                      setSelectedSaleId(sale.id);
                      setQtyByDetailId({});
                    }}
                    className={`min-w-[220px] rounded-[14px] border p-3 text-left transition ${
                      selectedSaleId === sale.id
                        ? "border-[#151514] bg-[#151514] text-white"
                        : "border-white bg-white text-[#20201d] hover:border-[#cbb8ff]"
                    }`}
                  >
                    <p className="truncate text-sm font-black">{sale.nomorInvoice}</p>
                    <p className="mt-1 text-xs font-bold opacity-60">{sale.tanggal ? formatDate(sale.tanggal) : "-"}</p>
                    <p className="mt-2 text-sm font-black text-[#0f766e]">{formatCurrency(sale.grandTotal)}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[14px] bg-white px-4 py-3 text-sm font-bold text-stone-500">
                  {selectedPelanggan ? "Belum ada penjualan yang bisa diretur." : "Pilih pelanggan dulu."}
                </div>
              )}
            </div>

            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-h-0 overflow-auto rounded-[18px] bg-white">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#f7f5ef] text-xs font-black uppercase text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Barang</th>
                      <th className="px-4 py-3">Sisa</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">Qty Retur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale ? (
                      selectedSale.details.map((detail) => (
                        <tr key={detail.id} className="border-t border-stone-100">
                          <td className="px-4 py-3">
                            <p className="font-black text-[#20201d]">{detail.namaBarang}</p>
                            <p className="text-xs font-bold text-stone-400">{unitLabel(detail.satuanNama)}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-stone-600">
                            {detail.sisaRetur} {unitLabel(detail.satuanNama)}
                          </td>
                          <td className="px-4 py-3 font-black text-[#20201d]">{formatCurrency(detail.hargaJual)}</td>
                          <td className="px-4 py-3">
                            <input
                              aria-label={`Qty retur ${detail.namaBarang}`}
                              type="number"
                              min={0}
                              max={detail.sisaRetur}
                              disabled={detail.sisaRetur <= 0}
                              value={qtyByDetailId[detail.id] ?? ""}
                              onChange={(event) =>
                                setQtyByDetailId((current) => ({
                                  ...current,
                                  [detail.id]: event.target.value
                                }))
                              }
                              className="h-10 w-24 rounded-[12px] border border-stone-200 bg-white px-3 text-sm font-black outline-none focus:border-[#0f766e] disabled:bg-stone-100"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-sm font-bold text-stone-500">
                          Pilih invoice untuk melihat barang.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <aside className="flex min-h-0 flex-col overflow-hidden rounded-[18px] bg-[#cbb8ff] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">Laporan Retur</p>
                    <p className="text-xs font-bold text-[#55458a]">{laporanRows.length} barang</p>
                  </div>
                  <RotateCcw className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {laporanRows.length ? (
                    laporanRows.slice(0, 30).map(({ retur, detail }) => (
                      <div key={detail.id} className="rounded-[12px] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-black">{detail.namaBarang}</p>
                          <p className="shrink-0 text-sm font-black text-[#0f766e]">{formatCurrency(detail.subtotal)}</p>
                        </div>
                        <p className="mt-1 text-xs font-bold text-stone-500">
                          {retur.namaPelanggan} - {retur.nomorInvoice}
                        </p>
                        <p className="mt-1 text-xs font-bold text-stone-400">
                          {detail.jumlah} {unitLabel(detail.satuanNama)} - {formatDate(retur.tanggal)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[12px] border border-dashed border-white/60 p-6 text-center text-sm font-bold text-[#55458a]">
                      Belum ada laporan retur.
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!selectedSale || !selectedItems.length}
                  className="mt-4 h-12 rounded-full bg-[#151514] font-black hover:bg-[#2a2a26]"
                >
                  <Save className="h-4 w-4" />
                  Simpan Retur
                </Button>
              </aside>
            </div>
          </section>
        </form>
      </main>
    </KasirPageShell>
  );
}
