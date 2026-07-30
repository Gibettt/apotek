"use client";

import { Save, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
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

function returUnitLabel(satuanNama?: string) {
  return satuanNama?.trim() || "item";
}

export function ReturPenjualanPage() {
  const { activeCabangId } = useCabangStore();
  const [pelangganQuery, setPelangganQuery] = useState("");
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] =
    useState<Pelanggan | null>(null);
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
          activePelanggan.map((item) =>
            returPenjualanService.salesByPelanggan(item.id)
          )
        );
        if (!active) return;
        setPelanggan(
          activePelanggan.filter((_, index) => returableSales[index].length)
        );
        setLaporanRetur(returResult.data);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat data retur"
          );
        }
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
        const rows = await returPenjualanService.salesByPelanggan(
          selectedPelanggan.id
        );
        if (!active) return;
        setSales(rows);
        setSelectedSaleId(rows[0]?.id ?? "");
        setQtyByDetailId({});
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat riwayat penjualan pelanggan"
          );
        }
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
    const normalized = pelangganQuery.trim().toLowerCase();
    if (!normalized) return pelanggan.slice(0, 8);

    return pelanggan
      .filter((item) =>
        [item.nama, item.kode, item.telepon].some((value) =>
          String(value ?? "").toLowerCase().includes(normalized)
        )
      )
      .slice(0, 8);
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

    if (!selectedPelanggan) {
      toast.error("Pelanggan wajib dipilih");
      return;
    }

    if (!selectedSale) {
      toast.error("Transaksi penjualan wajib dipilih");
      return;
    }

    if (!alasan.trim()) {
      toast.error("Alasan retur wajib diisi");
      return;
    }

    if (!selectedItems.length) {
      toast.error("Minimal satu barang wajib diretur");
      return;
    }

    for (const item of selectedItems) {
      if (item.jumlah > item.detail.sisaRetur) {
        toast.error(
          `Jumlah retur ${item.detail.namaBarang} melebihi sisa retur (${item.detail.sisaRetur})`
        );
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
      if (!rows.length) {
        setPelanggan((current) =>
          current.filter((item) => item.id !== selectedPelanggan.id)
        );
        setSelectedPelanggan(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan retur"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Retur Penjualan"
        description="Cari pelanggan, lihat barang yang pernah dibeli, lalu proses retur dan stok masuk."
      />

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="h-max dashboard-surface">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#f8f7f3] text-[#0f766e]">
              <UserRound className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Pelanggan</h2>
              <p className="text-sm font-semibold text-stone-500">
                {selectedPelanggan?.nama ?? "Cari nama pelanggan"}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={pelangganQuery}
              disabled={isLoadingPelanggan}
              onChange={(event) => setPelangganQuery(event.target.value)}
              placeholder={
                isLoadingPelanggan ? "Memuat pelanggan..." : "Cari nama pelanggan"
              }
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
            />
          </div>

          <div className="mt-3 grid gap-2">
            {filteredPelanggan.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedPelanggan(item);
                  setPelangganQuery("");
                }}
                className={`flex h-11 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-bold transition ${
                  selectedPelanggan?.id === item.id
                    ? "bg-[#20201d] text-white"
                    : "bg-[#f8f7f3] text-stone-600 hover:text-stone-950"
                }`}
              >
                <span className="min-w-0 truncate">{item.nama}</span>
                <span className="shrink-0 text-xs opacity-70">
                  {item.telepon || item.kode}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0 dashboard-surface">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Riwayat Penjualan
              </h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                {selectedPelanggan
                  ? "Pilih invoice, lalu isi jumlah barang yang diretur."
                  : "Pilih pelanggan dulu."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase text-stone-400">
                Total Refund
              </p>
              <p className="mt-1 text-2xl font-black text-[#20201d]">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="Tanggal Retur"
              type="date"
              value={tanggal}
              onChange={(event) => setTanggal(event.target.value)}
            />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Alasan Retur</span>
              <input
                value={alasan}
                onChange={(event) => setAlasan(event.target.value)}
                placeholder="Contoh: barang salah beli"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3">
            {isLoadingSales ? (
              <div className="rounded-lg border border-dashed border-stone-200 bg-[#f8f7f3] p-8 text-center text-sm font-bold text-stone-500">
                Memuat riwayat penjualan...
              </div>
            ) : sales.length ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sales.map((sale) => (
                  <button
                    key={sale.id}
                    type="button"
                    onClick={() => {
                      setSelectedSaleId(sale.id);
                      setQtyByDetailId({});
                    }}
                    className={`min-w-[220px] rounded-lg border p-3 text-left transition ${
                      selectedSaleId === sale.id
                        ? "border-[#0f766e] bg-emerald-50"
                        : "border-stone-200 bg-white hover:bg-[#f8f7f3]"
                    }`}
                  >
                    <p className="font-black text-[#20201d]">
                      {sale.nomorInvoice}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-stone-500">
                      {sale.tanggal ? formatDate(sale.tanggal) : "-"}
                    </p>
                    <p className="mt-2 text-sm font-black text-[#0f766e]">
                      {formatCurrency(sale.grandTotal)}
                    </p>
                  </button>
                ))}
              </div>
            ) : selectedPelanggan ? (
              <div className="rounded-lg border border-dashed border-stone-200 bg-[#f8f7f3] p-8 text-center text-sm font-bold text-stone-500">
                Belum ada penjualan untuk pelanggan ini.
              </div>
            ) : null}
          </div>

          {selectedSale ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Barang</th>
                      <th className="px-4 py-3">Satuan</th>
                      <th className="px-4 py-3">Terjual</th>
                      <th className="px-4 py-3">Sudah Retur</th>
                      <th className="px-4 py-3">Sisa</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">Qty Retur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.details.map((detail) => (
                      <tr key={detail.id} className="border-t border-stone-100">
                        <td className="px-4 py-3">
                          <p className="font-black text-[#20201d]">
                            {detail.namaBarang}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-600">
                          {returUnitLabel(detail.satuanNama)}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-600">
                          {detail.jumlah}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-600">
                          {detail.sudahDiretur}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-600">
                          {detail.sisaRetur}
                        </td>
                        <td className="px-4 py-3 font-black text-[#20201d]">
                          {formatCurrency(detail.hargaJual)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex h-10 w-36 overflow-hidden rounded-lg border border-stone-200 bg-white transition focus-within:border-[#0f766e] focus-within:ring-4 focus-within:ring-[#0f766e]/10">
                            <input
                              aria-label={`Qty retur ${detail.namaBarang} dalam ${returUnitLabel(detail.satuanNama)}`}
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
                              className="h-full min-w-0 flex-1 bg-white px-3 text-sm font-black text-[#20201d] outline-none disabled:bg-stone-100 disabled:text-stone-400"
                            />
                            <span className="grid max-w-[72px] shrink-0 place-items-center truncate border-l border-stone-200 bg-[#f8f7f3] px-2 text-xs font-black text-stone-500">
                              {returUnitLabel(detail.satuanNama)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!selectedSale || !selectedItems.length}
              className="h-11 rounded-lg bg-[#0f766e] px-5 font-black hover:bg-[#115e59]"
            >
              <Save className="h-4 w-4" />
              Simpan Retur
            </Button>
          </div>
        </section>
      </form>

      <section className="mt-5 dashboard-surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#20201d]">
              Laporan Retur
            </h2>
            <p className="mt-1 text-sm font-semibold text-stone-500">
              Barang yang sudah selesai diretur pelanggan.
            </p>
          </div>
          <p className="text-sm font-black text-[#0f766e]">
            {laporanRows.length} barang
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Barang</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Satuan</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {laporanRows.length ? (
                  laporanRows.map(({ retur, detail }) => (
                    <tr key={detail.id} className="border-t border-stone-100">
                      <td className="px-4 py-3 font-black text-[#20201d]">
                        {retur.namaPelanggan}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-600">
                        {retur.tanggal ? formatDate(retur.tanggal) : "-"}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-600">
                        {retur.nomorInvoice}
                      </td>
                      <td className="px-4 py-3 font-black text-[#20201d]">
                        {detail.namaBarang}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-600">
                        {detail.jumlah}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-600">
                        {detail.satuanNama ?? "-"}
                      </td>
                      <td className="px-4 py-3 font-black text-[#20201d]">
                        {formatCurrency(detail.hargaJual)}
                      </td>
                      <td className="px-4 py-3 font-black text-[#0f766e]">
                        {formatCurrency(detail.subtotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm font-bold text-stone-500"
                    >
                      Belum ada laporan retur penjualan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
