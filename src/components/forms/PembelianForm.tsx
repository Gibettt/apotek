"use client";

import { ArrowLeft, Lock, PackagePlus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  pembelianService,
  type PembelianInput,
  type SatuanKonversi
} from "@/services/pembelianService";
import {
  obatService,
  type MasterOption,
  type ObatListItem
} from "@/services/obatService";
import { supplierService } from "@/services/supplierService";
import { useAuthStore } from "@/store/authStore";
import { useCabangStore } from "@/store/cabangStore";
import type { StatusPembelian, Supplier } from "@/types";
import { generateAutoKode } from "@/utils/autoKode";
import { formatCurrency } from "@/utils/formatCurrency";

type DiskonMode = "rp" | "persen";

interface PembelianFormItem {
  kategoriId: string;
  barangId: string;
  barangNama: string;
  autoKode: string;
  satuanId: string;
  konversi: string;
  konversiLocked: boolean;
  jumlahDikirim: string;
  jumlahDiterima: string;
  jumlahDitolak: string;
  batchNumber: string;
  tanggalExpired: string;
  hargaBeli: string;
  diskon: string;
  diskonMode: DiskonMode;
}

const emptyItem: PembelianFormItem = {
  kategoriId: "",
  barangId: "",
  barangNama: "",
  autoKode: "",
  satuanId: "",
  konversi: "",
  konversiLocked: false,
  jumlahDikirim: "1",
  jumlahDiterima: "1",
  jumlahDitolak: "0",
  batchNumber: "",
  tanggalExpired: "",
  hargaBeli: "0",
  diskon: "0",
  diskonMode: "rp"
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function generateAutoBatchNumber(rowIndex: number, tanggalPembelian: string) {
  const datePart = (tanggalPembelian || todayInputValue()).replace(/-/g, "");
  return `BATCH-${datePart}-${String(rowIndex + 1).padStart(3, "0")}`;
}

function parseNumberInput(value: string) {
  if (value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function konversiValue(item: PembelianFormItem) {
  const parsed = parseNumberInput(item.konversi);
  return parsed > 0 ? parsed : 1;
}

function konversiKey(barangId: string, satuanDariId: string, satuanKeId: string) {
  return `${barangId}:${satuanDariId}:${satuanKeId}`;
}

function resolveKonversi(
  barangId: string,
  satuanId: string,
  obatById: Record<string, ObatListItem>,
  konversiByKey: Record<string, SatuanKonversi>
) {
  const satuanDasarId = barangId ? obatById[barangId]?.satuanDefaultId : undefined;

  if (!barangId || !satuanId || !satuanDasarId) {
    return { konversi: "", konversiLocked: false };
  }

  if (satuanId === satuanDasarId) {
    return { konversi: "1", konversiLocked: true };
  }

  const saved = konversiByKey[konversiKey(barangId, satuanId, satuanDasarId)];

  return saved
    ? { konversi: String(saved.nilaiKonversi), konversiLocked: true }
    : { konversi: "", konversiLocked: false };
}

function stokBertambah(item: PembelianFormItem) {
  return parseNumberInput(item.jumlahDiterima) * konversiValue(item);
}

function lineGross(item: PembelianFormItem) {
  return parseNumberInput(item.jumlahDiterima) * parseNumberInput(item.hargaBeli);
}

function lineDiskonNominal(item: PembelianFormItem) {
  return item.diskonMode === "persen"
    ? lineGross(item) * (parseNumberInput(item.diskon) / 100)
    : parseNumberInput(item.diskon);
}

function lineSubtotal(item: PembelianFormItem) {
  return Math.max(0, lineGross(item) - lineDiskonNominal(item));
}

function itemHasContent(item: PembelianFormItem) {
  return Boolean(item.barangId || item.barangNama.trim());
}

function optionLabel(options: MasterOption[], id: string) {
  return options.find((option) => String(option.id) === id)?.label ?? "-";
}

export function PembelianForm() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "owner") {
    return (
      <>
        <Header
          title="Pembelian terkunci"
          description="Pembelian supplier hanya bisa diakses akun owner."
          action={
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          }
        />
        <section className="dashboard-surface grid min-h-[360px] place-items-center">
          <div className="grid max-w-sm place-items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b]">
              <Lock className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h2 className="text-xl font-black text-[#20201d]">Khusus Owner</h2>
            <p className="text-sm font-semibold leading-6 text-stone-500">
              Form pembelian hanya bisa dipakai akun owner.
            </p>
          </div>
        </section>
      </>
    );
  }

  return <PembelianFormContent />;
}

function PembelianFormContent() {
  const router = useRouter();
  const { activeCabangId } = useCabangStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [obatOptions, setObatOptions] = useState<ObatListItem[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<MasterOption[]>([]);
  const [kategoriOptions, setKategoriOptions] = useState<MasterOption[]>([]);
  const [konversiSatuan, setKonversiSatuan] = useState<SatuanKonversi[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [tanggalPembelian, setTanggalPembelian] = useState(todayInputValue());
  const [status, setStatus] = useState<StatusPembelian>("draft");
  const [catatan, setCatatan] = useState("");
  const [diskon, setDiskon] = useState("0");
  const [pajak, setPajak] = useState("0");
  const [items, setItems] = useState<PembelianFormItem[]>([]);
  const [draftItem, setDraftItem] = useState<PembelianFormItem>(() => ({ ...emptyItem }));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [visibleItemCount, setVisibleItemCount] = useState(50);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [supplierResult, obatResult, satuanResult, kategoriResult, konversiResult] =
          await Promise.all([
            supplierService.list({ perPage: 1000 }),
            obatService.list({ perPage: 1000 }),
            obatService.listSatuanOptions(),
            obatService.listKategoriOptions(),
            pembelianService.listKonversiSatuan()
          ]);

        if (!active) {
          return;
        }

        setSuppliers(supplierResult.data.filter((supplier) => supplier.aktif));
        setObatOptions(obatResult.data.filter((obat) => obat.status));
        setSatuanOptions(satuanResult);
        setKategoriOptions(kategoriResult);
        setKonversiSatuan(konversiResult);
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

  const obatByNama = useMemo(
    () =>
      Object.fromEntries(
        obatOptions.map((obat) => [obat.nama.trim().toLowerCase(), obat])
      ) as Record<string, ObatListItem>,
    [obatOptions]
  );

  const konversiByKey = useMemo(
    () =>
      Object.fromEntries(
        konversiSatuan.map((item) => [
          konversiKey(item.barangId, item.satuanDariId, item.satuanKeId),
          item
        ])
      ) as Record<string, SatuanKonversi>,
    [konversiSatuan]
  );

  const effectiveItems = useMemo(() => {
    if (!itemHasContent(draftItem)) {
      return items;
    }

    return editingIndex === null
      ? [...items, draftItem]
      : items.map((item, index) => (index === editingIndex ? draftItem : item));
  }, [draftItem, editingIndex, items]);

  const subtotal = useMemo(
    () => effectiveItems.reduce((sum, item) => sum + lineSubtotal(item), 0),
    [effectiveItems]
  );
  const diskonValue = parseNumberInput(diskon);
  const pajakPersen = parseNumberInput(pajak);
  const pajakValue = Math.max(0, subtotal - diskonValue) * (pajakPersen / 100);
  const total = Math.max(0, subtotal - diskonValue + pajakValue);

  const visibleItems = useMemo(
    () => items.slice(0, visibleItemCount),
    [items, visibleItemCount]
  );

  const updateDraftItem = useCallback((updater: (item: PembelianFormItem) => PembelianFormItem) => {
    setDraftItem(updater);
  }, []);

  const handleBarangNameChange = useCallback((value: string) => {
    const trimmed = value.trim();
    const matchedObat = obatByNama[trimmed.toLowerCase()];

    updateDraftItem((item) => ({
      ...item,
      barangNama: value,
      barangId: matchedObat?.id ?? "",
      // belum ada di data Barang -> siapin preview kode yang bakal beneran dipakai pas disimpan
      autoKode: matchedObat || !trimmed ? "" : generateAutoKode(trimmed, { unique: true }),
      satuanId: matchedObat?.satuanBeliId ?? item.satuanId,
      ...(matchedObat
        ? resolveKonversi(
            matchedObat.id,
            matchedObat.satuanBeliId ?? item.satuanId,
            obatById,
            konversiByKey
          )
        : { konversi: item.satuanId ? "1" : item.konversi, konversiLocked: Boolean(item.satuanId) }),
      kategoriId: matchedObat?.kategoriId ?? item.kategoriId,
      hargaBeli: matchedObat
        ? String(matchedObat.hargaAktif?.hargaBeli ?? 0)
        : item.hargaBeli
    }));
  }, [konversiByKey, obatById, obatByNama, updateDraftItem]);

  const handleSatuanChange = useCallback((satuanId: string) => {
    updateDraftItem((item) => ({
      ...item,
      satuanId,
      ...(item.barangId
        ? resolveKonversi(item.barangId, satuanId, obatById, konversiByKey)
        : { konversi: satuanId ? "1" : "", konversiLocked: Boolean(satuanId) })
    }));
  }, [konversiByKey, obatById, updateDraftItem]);

  const removeItem = useCallback((index: number) => {
    setItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) {
      setDraftItem({ ...emptyItem });
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [editingIndex]);

  function resetDraft() {
    setDraftItem({ ...emptyItem });
    setEditingIndex(null);
  }

  function saveDraftItem() {
    if (!itemHasContent(draftItem)) {
      toast.error("Nama barang wajib diisi sebelum ditambahkan");
      return;
    }

    if (editingIndex === null) {
      setItems((currentItems) => [...currentItems, { ...draftItem }]);
    } else {
      setItems((currentItems) =>
        currentItems.map((item, index) =>
          index === editingIndex ? { ...draftItem } : item
        )
      );
    }

    resetDraft();
  }

  function editItem(index: number) {
    const item = items[index];
    if (!item) return;
    setDraftItem({ ...item });
    setEditingIndex(index);
  }

  /** Baris yang nama obatnya belum cocok data master otomatis dibuatkan barang baru, jadi apapun yang diketik di sini pasti nongol di fitur Barang. */
  async function resolveBarangId(
    item: PembelianFormItem,
    createdIdByNama: Map<string, string>
  ) {
    if (item.barangId) {
      return item.barangId;
    }

    const namaKey = item.barangNama.trim().toLowerCase();
    const cached = createdIdByNama.get(namaKey);

    if (cached) {
      return cached;
    }

    const konversi = konversiValue(item);
    const createdObat = await obatService.create({
      kode: item.autoKode || generateAutoKode(item.barangNama, { unique: true }),
      nama: item.barangNama.trim(),
      kategoriId: item.kategoriId || undefined,
      satuanDefaultId: item.satuanId || undefined,
      satuanBeliId: item.satuanId || undefined,
      satuanJualId: item.satuanId || undefined,
      hargaBeli: parseNumberInput(item.hargaBeli) / konversi,
      supplierId,
      status: true
    });

    createdIdByNama.set(namaKey, createdObat.id);
    return createdObat.id;
  }

  async function buildPayload(): Promise<PembelianInput | null> {
    if (!supplierId) {
      toast.error("Supplier wajib dipilih");
      return null;
    }

    if (!tanggalPembelian) {
      toast.error("Tanggal pembelian wajib diisi");
      return null;
    }

    const rowsToSubmit = effectiveItems.filter(
      (item) =>
        (item.barangId || item.barangNama.trim()) &&
        parseNumberInput(item.jumlahDiterima) > 0
    );

    if (!rowsToSubmit.length) {
      toast.error("Minimal satu item obat wajib diisi");
      return null;
    }

    const createdIdByNama = new Map<string, string>();
    const validItems = [];

    for (const item of rowsToSubmit) {
      if (!item.satuanId) {
        toast.error(`Satuan pembelian ${item.barangNama.trim() || "item"} wajib dipilih`);
        return null;
      }

      const jumlahDikirim = parseNumberInput(item.jumlahDikirim);
      const jumlahDiterima = parseNumberInput(item.jumlahDiterima);
      const jumlahDitolak = parseNumberInput(item.jumlahDitolak);
      const konversi = konversiValue(item);

      if (item.barangId && !obatById[item.barangId]?.satuanDefaultId) {
        toast.error(`Satuan dasar ${item.barangNama.trim() || "item"} belum diatur di master barang`);
        return null;
      }

      if (jumlahDikirim > 0 && jumlahDiterima + jumlahDitolak > jumlahDikirim) {
        toast.error(`Jumlah diterima + ditolak ${item.barangNama.trim() || "item"} melebihi jumlah dikirim`);
        return null;
      }

      const barangId = await resolveBarangId(item, createdIdByNama);
      const satuanDasarId = obatById[barangId]?.satuanDefaultId ?? item.satuanId;
      const hargaBeliInput = parseNumberInput(item.hargaBeli);

      validItems.push({
        barangId,
        satuanId: item.satuanId || undefined,
        satuanDasarId,
        konversi,
        jumlahDikirim,
        jumlahDiterima,
        jumlahDitolak,
        batchNumber: generateAutoBatchNumber(validItems.length, tanggalPembelian),
        tanggalExpired: item.tanggalExpired,
        // qty diterima dinormalisasi ke satuan stok (base unit) memakai konversi
        jumlah: jumlahDiterima * konversi,
        // harga beli dinormalisasi per satuan stok agar subtotal tetap konsisten
        hargaBeli: hargaBeliInput / konversi,
        diskonPersen:
          item.diskonMode === "persen" ? parseNumberInput(item.diskon) : 0,
        diskonNominal:
          item.diskonMode === "rp" ? parseNumberInput(item.diskon) : 0
      });
    }

    return {
      supplierId,
      cabangId: activeCabangId ?? undefined,
      tanggalFaktur: tanggalPembelian,
      status,
      catatan,
      diskonTotal: diskonValue,
      pajakTotal: pajakValue,
      items: validItems
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = await buildPayload();

      if (!payload) {
        return;
      }

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
        <section className="min-w-0 overflow-hidden dashboard-surface xl:col-start-1 xl:row-start-1">
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
              label="Pajak (%)"
              type="number"
              min={0}
              max={100}
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
        </section>

        <section className="min-w-0 overflow-hidden dashboard-surface xl:col-start-1 xl:col-span-2 xl:row-start-2">
          <div>
            <h2 className="text-lg font-black text-[#20201d]">
              Item Pembelian
            </h2>
            <p className="mt-1 text-sm font-semibold text-stone-500">
              Isi satu item, tambahkan ke daftar, lalu ulangi sesuai kebutuhan.
              Nama yang belum ada di data Barang akan otomatis dibuatkan barang baru saat pembelian disimpan.
            </p>
          </div>

          <datalist id="pembelian-barang-options">
            {obatOptions.map((obat) => (
              <option key={obat.id} value={obat.nama} />
            ))}
          </datalist>

          <div className="mt-4 rounded-lg border border-stone-200 bg-[#f8f7f3] p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Select
                label="Kategori"
                value={draftItem.kategoriId}
                disabled={isLoadingOptions}
                onChange={(event) =>
                  updateDraftItem((item) => ({
                    ...item,
                    kategoriId: event.target.value
                  }))
                }
                options={[
                  { label: "Pilih kategori", value: "" },
                  ...kategoriOptions.map((kategori) => ({
                    label: kategori.label,
                    value: kategori.id
                  }))
                ]}
              />
              <Input
                label="Barang"
                list="pembelian-barang-options"
                value={draftItem.barangNama}
                disabled={isLoadingOptions}
                onChange={(event) => handleBarangNameChange(event.target.value)}
                placeholder="Ketik nama obat"
                title={
                  draftItem.barangNama.trim() && !draftItem.barangId
                    ? "Obat baru, akan otomatis dibuat di fitur Barang saat disimpan"
                    : undefined
                }
              />
              <Input
                label="Kode Barang"
                value={draftItem.barangId ? obatById[draftItem.barangId]?.kode ?? "-" : draftItem.autoKode || "-"}
                readOnly
                className="bg-white font-bold text-stone-500"
              />
              <Select
                label="Satuan Pembelian"
                value={draftItem.satuanId}
                onChange={(event) => handleSatuanChange(event.target.value)}
                options={[
                  { label: "Pilih satuan", value: "" },
                  ...satuanOptions.map((satuan) => ({
                    label: satuan.label,
                    value: satuan.id
                  }))
                ]}
              />
              <Input
                label="Jumlah Dikirim"
                type="number"
                min={0}
                value={draftItem.jumlahDikirim}
                onChange={(event) =>
                  updateDraftItem((item) => ({
                    ...item,
                    jumlahDikirim: event.target.value
                  }))
                }
              />
              <Input
                label="Jumlah Diterima"
                type="number"
                min={0}
                value={draftItem.jumlahDiterima}
                onChange={(event) =>
                  updateDraftItem((item) => ({
                    ...item,
                    jumlahDiterima: event.target.value
                  }))
                }
              />
              <Input
                label="Jumlah Ditolak"
                type="number"
                min={0}
                value={draftItem.jumlahDitolak}
                onChange={(event) =>
                  updateDraftItem((item) => ({
                    ...item,
                    jumlahDitolak: event.target.value
                  }))
                }
              />
              <Input
                label="Kedaluwarsa"
                type="date"
                value={draftItem.tanggalExpired}
                onChange={(event) =>
                  updateDraftItem((item) => ({
                    ...item,
                    tanggalExpired: event.target.value
                  }))
                }
              />
              <Input
                label="Harga Beli"
                type="number"
                min={0}
                value={draftItem.hargaBeli}
                onChange={(event) =>
                  updateDraftItem((item) => ({
                    ...item,
                    hargaBeli: event.target.value
                  }))
                }
              />
              <div className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span>Diskon Item</span>
                <div className="flex">
                  <Input
                    aria-label="Diskon Item"
                    type="number"
                    min={0}
                    value={draftItem.diskon}
                    onChange={(event) =>
                      updateDraftItem((item) => ({
                        ...item,
                        diskon: event.target.value
                      }))
                    }
                    className="rounded-r-none"
                  />
                  <select
                    aria-label="Mode Diskon Item"
                    value={draftItem.diskonMode}
                    onChange={(event) =>
                      updateDraftItem((item) => ({
                        ...item,
                        diskonMode: event.target.value as DiskonMode
                      }))
                    }
                    className="h-10 w-16 rounded-r-xl border border-l-0 border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="rp">Rp</option>
                    <option value="persen">%</option>
                  </select>
                </div>
              </div>
              <div className="grid content-end gap-1.5 rounded-lg bg-white p-3 text-sm font-semibold text-stone-600">
                <div className="flex justify-between gap-3">
                  <span>Subtotal item</span>
                  <strong className="text-[#20201d]">
                    {formatCurrency(lineSubtotal(draftItem))}
                  </strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Stok bertambah</span>
                  <strong className="text-emerald-700">
                    +{stokBertambah(draftItem)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {editingIndex !== null ? (
                <Button type="button" variant="secondary" onClick={resetDraft}>
                  Batal Edit
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={saveDraftItem}
                className="h-10 rounded-lg bg-[#20201d] px-4 font-bold hover:bg-[#33312d]"
              >
                {editingIndex === null ? "Tambah Item" : "Update Item"}
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-auto rounded-lg border border-stone-200">
            <table className="min-w-[1200px] w-full table-fixed text-sm">
              <thead className="bg-[#20201d] text-white">
                <tr>
                  <th className="w-12 px-3 py-3 text-center text-[10px] font-black uppercase leading-tight tracking-wide">No</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Barang</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Kategori</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Satuan</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Dikirim</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Diterima</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Ditolak</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Batch</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Expired</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Harga</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Subtotal</th>
                  <th className="w-28 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {visibleItems.length ? (
                  visibleItems.map((item, index) => (
                    <tr key={`${item.barangNama}-${index}`} className="border-t border-stone-100 bg-white even:bg-[#faf9f6]">
                      <td className="px-3 py-3 text-center text-xs font-bold text-stone-600">{index + 1}</td>
                      <td className="px-3 py-3">
                        <p className="truncate font-black text-[#20201d]">{item.barangNama || "-"}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-stone-400">
                          {item.barangId ? obatById[item.barangId]?.kode ?? "-" : item.autoKode || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-600">{optionLabel(kategoriOptions, item.kategoriId)}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-600">{optionLabel(satuanOptions, item.satuanId)}</td>
                      <td className="px-3 py-3 text-right text-xs font-bold text-stone-700">{parseNumberInput(item.jumlahDikirim)}</td>
                      <td className="px-3 py-3 text-right text-xs font-bold text-stone-700">{parseNumberInput(item.jumlahDiterima)}</td>
                      <td className="px-3 py-3 text-right text-xs font-bold text-stone-700">{parseNumberInput(item.jumlahDitolak)}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-600">{generateAutoBatchNumber(index, tanggalPembelian)}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-600">{item.tanggalExpired || "-"}</td>
                      <td className="px-3 py-3 text-right text-xs font-bold text-stone-700">{formatCurrency(parseNumberInput(item.hargaBeli))}</td>
                      <td className="px-3 py-3 text-right text-xs font-black text-[#20201d]">{formatCurrency(lineSubtotal(item))}</td>
                      <td className="px-2 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Edit item ${index + 1}`}
                            onClick={() => editItem(index)}
                            className="h-8 rounded-md bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus item ${index + 1}`}
                            onClick={() => removeItem(index)}
                            className="grid h-8 w-8 place-items-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-sm font-semibold text-stone-500">
                      Belum ada item pembelian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-500">
              {items.length
                ? `Menampilkan ${visibleItems.length} dari ${items.length} item`
                : "Data item yang sudah ditambahkan akan tampil di sini."}
            </p>
            {visibleItemCount < items.length ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVisibleItemCount((count) => count + 50)}
              >
                Tampilkan 50 Lagi
              </Button>
            ) : null}
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="h-11 rounded-lg bg-[#0f766e] px-5 font-black hover:bg-[#115e59]"
            >
              <Save className="h-4 w-4" />
              Simpan Pembelian
            </Button>
          </div>
        </section>

        <aside className="h-max dashboard-surface xl:col-start-2 xl:row-start-1">
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
              <span>Pajak ({pajakPersen}%)</span>
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
        </aside>
      </form>
    </>
  );
}
