"use client";

import { ArrowLeft, PackageMinus, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { obatService, type ObatListItem } from "@/services/obatService";
import { returPembelianService, type ReturPembelianInput } from "@/services/returPembelianService";
import { stokService, type StokBatchOption } from "@/services/stokService";
import { supplierService } from "@/services/supplierService";
import { useCabangStore } from "@/store/cabangStore";
import type { StatusRetur, Supplier } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

interface ReturFormItem {
  barangId: string;
  batchId: string;
  batches: StokBatchOption[];
  jumlah: string;
  hargaBeli: string;
}

const emptyItem: ReturFormItem = {
  barangId: "",
  batchId: "",
  batches: [],
  jumlah: "1",
  hargaBeli: "0"
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseNumberInput(value: string) {
  if (value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function lineSubtotal(item: ReturFormItem) {
  return Math.max(0, parseNumberInput(item.jumlah) * parseNumberInput(item.hargaBeli));
}

export function ReturForm() {
  const router = useRouter();
  const { activeCabangId } = useCabangStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [obatOptions, setObatOptions] = useState<ObatListItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [tanggal, setTanggal] = useState(todayInputValue());
  const [alasan, setAlasan] = useState("");
  const [status, setStatus] = useState<StatusRetur>("draft");
  const [items, setItems] = useState<ReturFormItem[]>([{ ...emptyItem }]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [supplierResult, obatResult] = await Promise.all([
          supplierService.list({ perPage: 1000 }),
          obatService.list({ perPage: 1000 })
        ]);

        if (!active) return;

        setSuppliers(supplierResult.data.filter((supplier) => supplier.aktif));
        setObatOptions(obatResult.data.filter((obat) => obat.status));
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Gagal memuat supplier dan obat");
        }
      } finally {
        if (active) setIsLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const obatById = useMemo(
    () => Object.fromEntries(obatOptions.map((obat) => [String(obat.id), obat])) as Record<string, ObatListItem>,
    [obatOptions]
  );

  const total = useMemo(() => items.reduce((sum, item) => sum + lineSubtotal(item), 0), [items]);

  function updateItem(index: number, updater: (item: ReturFormItem) => ReturFormItem) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
  }

  async function handleObatChange(index: number, value: string) {
    const selectedObat = obatById[value];

    updateItem(index, (item) => ({
      ...item,
      barangId: value,
      batchId: "",
      batches: [],
      hargaBeli: selectedObat ? String(selectedObat.hargaAktif?.hargaBeli ?? 0) : item.hargaBeli
    }));

    if (!value) return;

    const batches = await stokService.batchesForBarang(value, activeCabangId ?? undefined);
    updateItem(index, (item) => (item.barangId === value ? { ...item, batches } : item));
  }

  function addItem() {
    setItems((current) => [...current, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? [{ ...emptyItem }] : current.filter((_, i) => i !== index)));
  }

  function validatePayload(): ReturPembelianInput | null {
    if (!supplierId) {
      toast.error("Supplier wajib dipilih");
      return null;
    }

    if (!alasan.trim()) {
      toast.error("Alasan retur wajib diisi");
      return null;
    }

    const validItems = items
      .filter((item) => item.barangId && parseNumberInput(item.jumlah) > 0)
      .map((item) => ({
        barangId: item.barangId,
        batchId: item.batchId || null,
        jumlah: parseNumberInput(item.jumlah),
        hargaBeli: parseNumberInput(item.hargaBeli)
      }));

    if (!validItems.length) {
      toast.error("Minimal satu item obat wajib diisi");
      return null;
    }

    for (const item of validItems) {
      const source = items.find((row) => row.barangId === item.barangId);
      const batch = source?.batches.find((option) => (option.batchId ?? "") === (item.batchId ?? ""));

      if (batch && item.jumlah > batch.qty) {
        toast.error(`Jumlah retur ${obatById[item.barangId]?.nama} melebihi stok batch (tersedia ${batch.qty})`);
        return null;
      }
    }

    return {
      supplierId,
      cabangId: activeCabangId ?? undefined,
      tanggal,
      alasan,
      status,
      items: validItems
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validatePayload();
    if (!payload) return;

    setIsSubmitting(true);

    try {
      await returPembelianService.create(payload);
      toast.success(
        status === "posted" ? "Retur tersimpan dan stok berhasil dikurangi" : "Draft retur berhasil disimpan"
      );
      router.push("/retur");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan retur");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Tambah Retur Pembelian"
        description="Kembalikan barang ke supplier. Status posted akan langsung mengurangi stok obat."
        action={
          <Link
            href="/retur"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 overflow-hidden dashboard-surface">
          <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <PackageMinus className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Informasi Retur</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
                Pilih supplier, batch yang dikembalikan, dan alasan retur.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Supplier"
              value={supplierId}
              disabled={isLoadingOptions}
              onChange={(event) => setSupplierId(event.target.value)}
              options={[
                { label: "Pilih supplier", value: "" },
                ...suppliers.map((supplier) => ({ label: supplier.nama, value: supplier.id }))
              ]}
            />
            <Input label="Tanggal Retur" type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusRetur)}
              options={[
                { label: "Draft - belum kurangi stok", value: "draft" },
                { label: "Posted - langsung kurangi stok", value: "posted" }
              ]}
            />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Alasan Retur</span>
              <textarea
                rows={3}
                value={alasan}
                onChange={(event) => setAlasan(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Contoh: barang rusak, mendekati expired"
              />
            </label>
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Item Retur</h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">Pilih obat, batch asal, dan jumlah dikembalikan.</p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#20201d] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              Item
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="rounded-lg border border-stone-200 bg-white p-4 shadow-[0_12px_32px_rgba(25,24,21,.04)]">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-stone-400">Item #{index + 1}</p>
                    <p className="mt-1 truncate text-sm font-black text-[#20201d]">
                      {obatById[item.barangId]?.nama ?? "Pilih obat"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Hapus item"
                    onClick={() => removeItem(index)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                  </button>
                </div>

                <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-12">
                  <div className="min-w-0 2xl:col-span-4">
                    <Select
                      label="Obat"
                      value={item.barangId}
                      disabled={isLoadingOptions}
                      onChange={(event) => void handleObatChange(index, event.target.value)}
                      options={[
                        { label: "Pilih obat", value: "" },
                        ...obatOptions.map((obat) => ({ label: obat.nama, value: obat.id }))
                      ]}
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-4">
                    <Select
                      label="Batch"
                      value={item.batchId}
                      disabled={!item.barangId}
                      onChange={(event) =>
                        updateItem(index, (current) => ({ ...current, batchId: event.target.value }))
                      }
                      options={[
                        { label: item.batches.length ? "Pilih batch" : "Tidak ada stok", value: "" },
                        ...item.batches.map((batch) => ({
                          label: `${batch.nomorBatch} (tersedia ${batch.qty})`,
                          value: batch.batchId ?? ""
                        }))
                      ]}
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-2">
                    <Input
                      label="Jumlah"
                      type="number"
                      min={1}
                      value={item.jumlah}
                      onChange={(event) => updateItem(index, (current) => ({ ...current, jumlah: event.target.value }))}
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-2">
                    <Input
                      label="Harga Beli"
                      type="number"
                      min={0}
                      value={item.hargaBeli}
                      onChange={(event) =>
                        updateItem(index, (current) => ({ ...current, hargaBeli: event.target.value }))
                      }
                    />
                  </div>
                  <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-[#f8f7f3] px-3 py-2 md:col-span-2 2xl:col-span-12">
                    <span className="text-xs font-black uppercase text-stone-400">Subtotal</span>
                    <span className="whitespace-nowrap text-sm font-black text-[#20201d]">
                      {formatCurrency(lineSubtotal(item))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-max dashboard-surface xl:sticky xl:top-24">
          <h2 className="text-lg font-black text-[#20201d]">Ringkasan</h2>
          <div className="mt-4 space-y-3 rounded-lg bg-[#f8f7f3] p-4 text-sm font-semibold text-stone-600">
            <div className="border-t border-stone-200 pt-3">
              <div className="flex justify-between gap-4">
                <span>Total Retur</span>
                <strong className="text-xl text-[#20201d]">{formatCurrency(total)}</strong>
              </div>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-[#fff0ea] p-3 text-xs font-bold leading-5 text-[#b04420]">
            Jika status dibuat posted, sistem langsung mengurangi stok untuk semua item retur.
          </p>
          <Button type="submit" isLoading={isSubmitting} className="mt-4 h-11 w-full rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]">
            <Save className="h-4 w-4" />
            Simpan Retur
          </Button>
        </aside>
      </form>
    </>
  );
}
