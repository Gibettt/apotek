"use client";

import { ArrowLeft, ClipboardPlus, Pill, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { obatService, type ObatListItem } from "@/services/obatService";
import { resepService, type MasterOption, type ResepInput } from "@/services/resepService";
import type { StatusResep } from "@/types";

interface ResepFormItem {
  barangId: string;
  aturanPakai: string;
  jumlah: string;
  catatan: string;
}

const emptyItem: ResepFormItem = {
  barangId: "",
  aturanPakai: "",
  jumlah: "1",
  catatan: ""
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

export function ResepForm() {
  const router = useRouter();
  const [pelangganOptions, setPelangganOptions] = useState<MasterOption[]>([]);
  const [obatOptions, setObatOptions] = useState<ObatListItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pelangganId, setPelangganId] = useState("");
  const [pelangganNama, setPelangganNama] = useState("");
  const [pelangganTelepon, setPelangganTelepon] = useState("");
  const [namaDokter, setNamaDokter] = useState("");
  const [noSipDokter, setNoSipDokter] = useState("");
  const [asalPuskesmas, setAsalPuskesmas] = useState("");
  const [tanggalResep, setTanggalResep] = useState(todayInputValue());
  const [status, setStatus] = useState<StatusResep>("menunggu");
  const [catatan, setCatatan] = useState("");
  const [items, setItems] = useState<ResepFormItem[]>([{ ...emptyItem }]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [pelangganResult, obatResult] = await Promise.all([
          resepService.listPelangganOptions(),
          obatService.list({ perPage: 1000 })
        ]);

        if (!active) {
          return;
        }

        setPelangganOptions(pelangganResult);
        setObatOptions(obatResult.data.filter((obat) => obat.status));
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat pelanggan dan obat"
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

  const filledItems = useMemo(
    () =>
      items.filter(
        (item) => item.barangId && parseNumberInput(item.jumlah) > 0
      ),
    [items]
  );

  const totalQty = useMemo(
    () =>
      filledItems.reduce(
        (sum, item) => sum + parseNumberInput(item.jumlah),
        0
      ),
    [filledItems]
  );

  function updateItem(
    index: number,
    updater: (item: ResepFormItem) => ResepFormItem
  ) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? updater(item) : item
      )
    );
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
    if (!pelangganId && !pelangganNama.trim()) {
      toast.error("Pilih pelanggan atau isi nama pelanggan baru");
      return null;
    }

    if (!namaDokter.trim()) {
      toast.error("Nama dokter wajib diisi");
      return null;
    }

    if (!noSipDokter.trim()) {
      toast.error("No SIP dokter wajib diisi");
      return null;
    }

    if (!tanggalResep) {
      toast.error("Tanggal resep wajib diisi");
      return null;
    }

    const validItems = items
      .filter((item) => item.barangId && parseNumberInput(item.jumlah) > 0)
      .map((item) => ({
        barangId: item.barangId,
        aturanPakai: item.aturanPakai.trim(),
        jumlah: parseNumberInput(item.jumlah),
        catatan: item.catatan.trim()
      }));

    if (!validItems.length) {
      toast.error("Minimal satu item obat wajib dipilih");
      return null;
    }

    const emptyRule = validItems.some((item) => !item.aturanPakai);

    if (emptyRule) {
      toast.error("Aturan pakai wajib diisi untuk setiap item");
      return null;
    }

    const payload: ResepInput = {
      pelangganId: pelangganId || undefined,
      pelangganNama: pelangganNama.trim(),
      pelangganTelepon: pelangganTelepon.trim(),
      namaDokter: namaDokter.trim(),
      noSipDokter: noSipDokter.trim(),
      asalPuskesmas: asalPuskesmas.trim(),
      tanggalResep,
      catatan: catatan.trim(),
      status,
      details: validItems
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
      await resepService.create(payload);
      toast.success("Resep berhasil disimpan ke Supabase");
      router.push("/resep");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan resep"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Tambah Resep"
        description="Input resep dokter, pilih obat, lalu simpan untuk diverifikasi apoteker."
        action={
          <Link
            href="/resep"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <section className="min-w-0 overflow-hidden dashboard-surface">
          <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <ClipboardPlus className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Informasi Resep
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
                Data tersimpan langsung ke tabel resep. Jika pelanggan belum
                ada, sistem akan membuat data pelanggan baru secara otomatis.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Pelanggan Terdaftar"
              value={pelangganId}
              disabled={isLoadingOptions}
              onChange={(event) => setPelangganId(event.target.value)}
              options={[
                { label: "Pilih pelanggan atau isi nama baru", value: "" },
                ...pelangganOptions.map((pelanggan) => ({
                  label: pelanggan.label,
                  value: pelanggan.id
                }))
              ]}
            />
            {!pelangganId ? (
              <Input
                label="Nama Pelanggan Baru"
                value={pelangganNama}
                onChange={(event) => setPelangganNama(event.target.value)}
                placeholder="Nama pelanggan"
              />
            ) : null}
            {!pelangganId ? (
              <Input
                label="Telepon Pelanggan"
                value={pelangganTelepon}
                onChange={(event) => setPelangganTelepon(event.target.value)}
                placeholder="Opsional"
              />
            ) : null}
            <Input
              label="Nama Dokter"
              value={namaDokter}
              onChange={(event) => setNamaDokter(event.target.value)}
              placeholder="dr. Nama Dokter"
            />
            <Input
              label="No SIP Dokter"
              value={noSipDokter}
              onChange={(event) => setNoSipDokter(event.target.value)}
              placeholder="SIP-0000"
            />
            <Input
              label="Asal Faskes"
              value={asalPuskesmas}
              onChange={(event) => setAsalPuskesmas(event.target.value)}
              placeholder="Klinik / puskesmas"
            />
            <Input
              label="Tanggal Resep"
              type="date"
              value={tanggalResep}
              onChange={(event) => setTanggalResep(event.target.value)}
            />
            <Select
              label="Status Awal"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusResep)}
              options={[
                { label: "Menunggu verifikasi", value: "menunggu" },
                { label: "Diproses", value: "diproses" }
              ]}
            />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Catatan</span>
              <textarea
                rows={3}
                value={catatan}
                onChange={(event) => setCatatan(event.target.value)}
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Catatan resep"
              />
            </label>
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Item Resep</h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                Tambahkan obat, jumlah, dan aturan pakai dari resep dokter.
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

                <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-12">
                  <div className="min-w-0 xl:col-span-5">
                    <Select
                      label="Obat"
                      value={item.barangId}
                      disabled={isLoadingOptions}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          barangId: event.target.value
                        }))
                      }
                      options={[
                        { label: "Pilih obat", value: "" },
                        ...obatOptions.map((obat) => ({
                          label: `${obat.nama} - stok ${obat.stokTersedia}`,
                          value: obat.id
                        }))
                      ]}
                    />
                  </div>
                  <div className="min-w-0 xl:col-span-2">
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
                  <div className="min-w-0 xl:col-span-5">
                    <Input
                      label="Aturan Pakai"
                      value={item.aturanPakai}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          aturanPakai: event.target.value
                        }))
                      }
                      placeholder="3x sehari setelah makan"
                    />
                  </div>
                  <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-12">
                    <span>Catatan Item</span>
                    <textarea
                      rows={2}
                      value={item.catatan}
                      onChange={(event) =>
                        updateItem(index, (current) => ({
                          ...current,
                          catatan: event.target.value
                        }))
                      }
                      className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      placeholder="Opsional"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-max dashboard-surface xl:sticky xl:top-24">
          <h2 className="text-lg font-black text-[#20201d]">Ringkasan</h2>
          <div className="mt-4 space-y-3 rounded-lg bg-[#f8f7f3] p-4 text-sm font-semibold text-stone-600">
            <div className="flex justify-between gap-4">
              <span>Item valid</span>
              <strong className="text-[#20201d]">{filledItems.length}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Total jumlah</span>
              <strong className="text-[#20201d]">{totalQty}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status</span>
              <strong className="text-right capitalize text-[#20201d]">
                {status}
              </strong>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-[#fff0ea] p-3 text-xs font-bold leading-5 text-[#b04420]">
            Data dummy resep sudah tidak dipakai. Jika tabel resep Supabase
            masih kosong, daftar resep akan tampil kosong sampai Anda menyimpan
            resep baru.
          </p>
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-700">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4" strokeWidth={1.9} />
              <span>Item obat akan masuk ke resep_detail.</span>
            </div>
          </div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="mt-4 h-11 w-full rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]"
          >
            <Save className="h-4 w-4" />
            Simpan Resep
          </Button>
        </aside>
      </form>
    </>
  );
}
