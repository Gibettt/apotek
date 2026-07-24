"use client";

import { ArrowLeft, PackagePlus, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  pembelianService,
  type PembelianInput
} from "@/services/pembelianService";
import { obatService, type ObatListItem } from "@/services/obatService";
import { supplierService } from "@/services/supplierService";
import { useCabangStore } from "@/store/cabangStore";
import type { StatusPembelian, Supplier } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

interface PembelianFormItem {
  barangId: string;
  batchNumber: string;
  tanggalExpired: string;
  jumlah: string;
  hargaBeli: string;
  diskon: string;
}

const emptyItem: PembelianFormItem = {
  barangId: "",
  batchNumber: "",
  tanggalExpired: "",
  jumlah: "1",
  hargaBeli: "0",
  diskon: "0"
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

function lineSubtotal(item: PembelianFormItem) {
  return Math.max(
    0,
    parseNumberInput(item.jumlah) * parseNumberInput(item.hargaBeli) -
      parseNumberInput(item.diskon)
  );
}

export function PembelianForm() {
  const router = useRouter();
  const { activeCabangId } = useCabangStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [obatOptions, setObatOptions] = useState<ObatListItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [tanggalPembelian, setTanggalPembelian] = useState(todayInputValue());
  const [status, setStatus] = useState<StatusPembelian>("draft");
  const [catatan, setCatatan] = useState("");
  const [diskon, setDiskon] = useState("0");
  const [pajak, setPajak] = useState("0");
  const [items, setItems] = useState<PembelianFormItem[]>([{ ...emptyItem }]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [supplierResult, obatResult] = await Promise.all([
          supplierService.list({ perPage: 1000 }),
          obatService.list({ perPage: 1000 })
        ]);

        if (!active) {
          return;
        }

        setSuppliers(supplierResult.data.filter((supplier) => supplier.aktif));
        setObatOptions(obatResult.data.filter((obat) => obat.status));
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat supplier dan obat"
          );
        }
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const obatById = useMemo(
    () =>
      Object.fromEntries(
        obatOptions.map((obat) => [String(obat.id), obat])
      ) as Record<string, ObatListItem>,
    [obatOptions]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + lineSubtotal(item), 0),
    [items]
  );
  const diskonValue = parseNumberInput(diskon);
  const pajakValue = parseNumberInput(pajak);
  const total = Math.max(0, subtotal - diskonValue + pajakValue);

  function updateItem(
    index: number,
    updater: (item: PembelianFormItem) => PembelianFormItem
  ) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? updater(item) : item
      )
    );
  }

  function handleObatChange(index: number, value: string) {
    const selectedObat = obatById[value];

    updateItem(index, (item) => ({
      ...item,
      barangId: value,
      hargaBeli: selectedObat
        ? String(selectedObat.hargaAktif?.hargaBeli ?? 0)
        : item.hargaBeli
    }));
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((currentItems) =>
      currentItems.length === 1
        ? [{ ...emptyItem }]
        : currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function validatePayload() {
    if (!supplierId) {
      toast.error("Supplier wajib dipilih");
      return null;
    }

    if (!tanggalPembelian) {
      toast.error("Tanggal pembelian wajib diisi");
      return null;
    }

    const validItems = items
      .filter((item) => item.barangId && parseNumberInput(item.jumlah) > 0)
      .map((item) => ({
        barangId: item.barangId,
        batchNumber: item.batchNumber,
        tanggalExpired: item.tanggalExpired,
        jumlah: parseNumberInput(item.jumlah),
        hargaBeli: parseNumberInput(item.hargaBeli),
        diskonNominal: parseNumberInput(item.diskon)
      }));

    if (!validItems.length) {
      toast.error("Minimal satu item obat wajib diisi");
      return null;
    }

    const payload: PembelianInput = {
      supplierId,
      cabangId: activeCabangId ?? undefined,
      tanggalFaktur: tanggalPembelian,
      status,
      catatan,
      diskonTotal: diskonValue,
      pajakTotal: pajakValue,
      items: validItems
    };

    return payload;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validatePayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);

    try {
      await pembelianService.create(payload);
      toast.success(
        status === "diterima"
          ? "Pembelian tersimpan dan stok berhasil ditambahkan"
          : "Draft pembelian berhasil disimpan"
      );
      router.push("/pembelian");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan pembelian"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Tambah Pembelian"
        description="Buat purchase order dari supplier. Status diterima akan langsung menambah stok obat."
        action={
          <Link
            href="/pembelian"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <section className="min-w-0 overflow-hidden dashboard-surface">
          <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <PackagePlus className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Informasi Pembelian
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
                Pilih supplier dan item obat. Batch akan masuk ke stok hanya
                saat status pembelian diterima.
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
                ...suppliers.map((supplier) => ({
                  label: supplier.nama,
                  value: supplier.id
                }))
              ]}
            />
            <Input
              label="Tanggal Pembelian"
              type="date"
              value={tanggalPembelian}
              onChange={(event) => setTanggalPembelian(event.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusPembelian)
              }
              options={[
                { label: "Draft - belum masuk stok", value: "draft" },
                { label: "Diterima - langsung masuk stok", value: "diterima" },
                { label: "Dibatalkan", value: "dibatalkan" }
              ]}
            />
            <Input
              label="Diskon Transaksi"
              type="number"
              min={0}
              value={diskon}
              onChange={(event) => setDiskon(event.target.value)}
            />
            <Input
              label="Pajak"
              type="number"
              min={0}
              value={pajak}
              onChange={(event) => setPajak(event.target.value)}
            />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Catatan</span>
              <textarea
                rows={3}
                value={catatan}
                onChange={(event) => setCatatan(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Catatan pembelian"
              />
            </label>
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Item Pembelian
              </h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                Tambahkan obat, batch, jumlah, dan harga beli.
              </p>
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
              <div
                key={index}
                className="rounded-lg border border-stone-200 bg-white p-4 shadow-[0_12px_32px_rgba(25,24,21,.04)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-stone-400">
                      Item #{index + 1}
                    </p>
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
                  <div className="min-w-0 2xl:col-span-5">
                    <Select
                      label="Obat"
                      value={item.barangId}
                      disabled={isLoadingOptions}
                      onChange={(event) =>
                        handleObatChange(index, event.target.value)
                      }
                      options={[
                        { label: "Pilih obat", value: "" },
                        ...obatOptions.map((obat) => ({
                          label: `${obat.nama} - ${formatCurrency(
                            obat.hargaAktif?.hargaBeli ?? 0
                          )}`,
                          value: obat.id
                        }))
                      ]}
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-4">
                    <Input
                      label="Batch"
                      value={item.batchNumber}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          batchNumber: event.target.value
                        }))
                      }
                      placeholder="BATCH-001"
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-3">
                    <Input
                      label="Expired"
                      type="date"
                      value={item.tanggalExpired}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          tanggalExpired: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-3">
                    <Input
                      label="Jumlah"
                      type="number"
                      min={1}
                      value={item.jumlah}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          jumlah: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-4">
                    <Input
                      label="Harga Beli"
                      type="number"
                      min={0}
                      value={item.hargaBeli}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          hargaBeli: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-3">
                    <Input
                      label="Diskon"
                      type="number"
                      min={0}
                      value={item.diskon}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          diskon: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-[#f8f7f3] px-3 py-2 md:col-span-2 2xl:col-span-2 2xl:self-end">
                    <span className="text-xs font-black uppercase text-stone-400">
                      Subtotal
                    </span>
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
          <h2 className="text-lg font-black text-[#20201d]">
            Ringkasan
          </h2>
          <div className="mt-4 space-y-3 rounded-lg bg-[#f8f7f3] p-4 text-sm font-semibold text-stone-600">
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <strong className="text-[#20201d]">
                {formatCurrency(subtotal)}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Diskon</span>
              <strong className="text-[#20201d]">
                {formatCurrency(diskonValue)}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Pajak</span>
              <strong className="text-[#20201d]">
                {formatCurrency(pajakValue)}
              </strong>
            </div>
            <div className="border-t border-stone-200 pt-3">
              <div className="flex justify-between gap-4">
                <span>Total</span>
                <strong className="text-xl text-[#20201d]">
                  {formatCurrency(total)}
                </strong>
              </div>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-[#fff0ea] p-3 text-xs font-bold leading-5 text-[#b04420]">
            Jika status dibuat diterima, sistem langsung membuat stok masuk
            untuk semua item pembelian.
          </p>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="mt-4 h-11 w-full rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]"
          >
            <Save className="h-4 w-4" />
            Simpan Pembelian
          </Button>
        </aside>
      </form>
    </>
  );
}
