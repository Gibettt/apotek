"use client";

import { ArrowLeft, Pill, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  obatService,
  type MasterOption,
  type ObatInput,
  type ObatListItem
} from "@/services/obatService";

interface ObatFormValues {
  kode: string;
  nama: string;
  kategoriId: string;
  golonganId: string;
  satuanDefaultId: string;
  supplierId: string;
  hargaBeli: number;
  hargaJual: number;
  stokMinimum: number;
  stokAwal: number;
  batchNumber: string;
  tanggalExpired: string;
  status: boolean;
  komposisi: string;
  indikasi: string;
  aturanPakai: string;
}

function toDefaultValues(record?: ObatListItem | null): ObatFormValues {
  return {
    kode: record?.kode ?? "",
    nama: record?.nama ?? "",
    kategoriId: record?.kategoriId ? String(record.kategoriId) : "",
    golonganId: record?.golonganId ? String(record.golonganId) : "",
    satuanDefaultId: record?.satuanDefaultId ? String(record.satuanDefaultId) : "",
    supplierId: "",
    hargaBeli: record?.hargaAktif?.hargaBeli ?? 0,
    hargaJual: record?.hargaAktif?.hargaJual ?? 0,
    stokMinimum: record?.stokMinimum ?? 0,
    stokAwal: 0,
    batchNumber: "",
    tanggalExpired: "",
    status: record?.status ?? true,
    komposisi: record?.komposisi ?? "",
    indikasi: record?.indikasi ?? "",
    aturanPakai: record?.aturanPakai ?? ""
  };
}

function optionList(label: string, items: MasterOption[]) {
  return [
    { label, value: "" },
    ...items.map((item) => ({
      label: item.label,
      value: String(item.id)
    }))
  ];
}

export function ObatForm({ record }: { record?: ObatListItem | null }) {
  const router = useRouter();
  const [kategoriOptions, setKategoriOptions] = useState<MasterOption[]>([]);
  const [golonganOptions, setGolonganOptions] = useState<MasterOption[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<MasterOption[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<MasterOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const isEdit = Boolean(record?.id);
  const values = useMemo(() => toDefaultValues(record), [record]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ObatFormValues>({ values });

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [kategori, golongan, satuan, supplier] = await Promise.all([
          obatService.listKategoriOptions(),
          obatService.listGolonganOptions(),
          obatService.listSatuanOptions(),
          obatService.listSupplierOptions()
        ]);

        if (!active) {
          return;
        }

        setKategoriOptions(kategori);
        setGolonganOptions(golongan);
        setSatuanOptions(satuan);
        setSupplierOptions(supplier);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat master data obat"
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

  async function onSubmit(formValues: ObatFormValues) {
    const payload: ObatInput = {
      kode: formValues.kode,
      nama: formValues.nama,
      kategoriId: formValues.kategoriId || undefined,
      golonganId: formValues.golonganId || undefined,
      satuanDefaultId: formValues.satuanDefaultId || undefined,
      supplierId: formValues.supplierId || undefined,
      hargaBeli: Number(formValues.hargaBeli || 0),
      hargaJual: Number(formValues.hargaJual || 0),
      stokMinimum: Number(formValues.stokMinimum || 0),
      komposisi: formValues.komposisi,
      indikasi: formValues.indikasi,
      aturanPakai: formValues.aturanPakai,
      status: formValues.status,
      stokAwal: Number(formValues.stokAwal || 0),
      batchNumber: formValues.batchNumber,
      tanggalExpired: formValues.tanggalExpired
    };

    try {
      if (isEdit && record?.id) {
        await obatService.update(record.id, payload);
        toast.success("Obat berhasil diperbarui di Supabase");
      } else {
        await obatService.create(payload);
        toast.success("Obat berhasil ditambahkan ke Supabase");
      }

      router.push("/obat");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan obat"
      );
    }
  }

  return (
    <>
      <Header
        title={isEdit ? "Edit Obat" : "Tambah Obat"}
        description="Simpan data obat langsung ke Supabase. Stok awal akan dicatat sebagai batch stok pertama."
        action={
          <Link
            href="/obat"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <Pill className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#20201d]">
              Informasi Obat
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
              Data dummy tidak dipakai lagi. Semua data pada form ini tersimpan
              ke Supabase.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Kode Obat"
              placeholder="OBT-0001"
              error={errors.kode?.message}
              {...register("kode", { required: "Kode obat wajib diisi" })}
            />
            <Input
              label="Nama Obat"
              placeholder="Paracetamol 500mg"
              error={errors.nama?.message}
              {...register("nama", { required: "Nama obat wajib diisi" })}
            />
            <Select
              label="Kategori"
              options={optionList("Tanpa kategori", kategoriOptions)}
              disabled={isLoadingOptions}
              {...register("kategoriId")}
            />
            <Select
              label="Golongan"
              options={optionList("Tanpa golongan", golonganOptions)}
              disabled={isLoadingOptions}
              {...register("golonganId")}
            />
            <Select
              label="Satuan"
              options={optionList("Pilih satuan", satuanOptions)}
              disabled={isLoadingOptions}
              {...register("satuanDefaultId")}
            />
            <Input
              label="Harga Beli"
              type="number"
              min={0}
              {...register("hargaBeli", { valueAsNumber: true })}
            />
            <Input
              label="Harga Jual"
              type="number"
              min={0}
              {...register("hargaJual", { valueAsNumber: true })}
            />
            <Input
              label="Stok Minimum"
              type="number"
              min={0}
              {...register("stokMinimum", { valueAsNumber: true })}
            />
            {!isEdit ? (
              <>
                <Input
                  label="Stok Awal"
                  type="number"
                  min={0}
                  {...register("stokAwal", { valueAsNumber: true })}
                />
                <Select
                  label="Supplier (stok awal)"
                  options={optionList("Tanpa supplier", supplierOptions)}
                  disabled={isLoadingOptions}
                  {...register("supplierId")}
                />
                <Input
                  label="Batch Number"
                  placeholder="AWAL-001"
                  {...register("batchNumber")}
                />
                <Input
                  label="Tanggal Expired"
                  type="date"
                  {...register("tanggalExpired")}
                />
              </>
            ) : null}
            <label className="flex h-10 items-center gap-3 self-end rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                {...register("status")}
              />
              Aktif
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Komposisi</span>
              <textarea
                rows={3}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Kandungan bahan aktif"
                {...register("komposisi")}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Indikasi</span>
              <textarea
                rows={3}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Kegunaan obat"
                {...register("indikasi")}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Aturan Pakai</span>
              <textarea
                rows={3}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Contoh: 3x sehari setelah makan"
                {...register("aturanPakai")}
              />
            </label>
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-5">
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
