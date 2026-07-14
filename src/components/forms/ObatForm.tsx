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
import type { ObatGolongan } from "@/types";

interface ObatFormValues {
  kodeObat: string;
  namaObat: string;
  kategoriId: string;
  supplierId: string;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  stokMinimum: number;
  stokAwal: number;
  batchNumber: string;
  tanggalExpired: string;
  lokasi: string;
  golongan: ObatGolongan;
  membutuhkanResep: boolean;
  status: boolean;
  deskripsi: string;
}

function toDefaultValues(record?: ObatListItem | null): ObatFormValues {
  return {
    kodeObat: record?.kodeObat ?? "",
    namaObat: record?.namaObat ?? "",
    kategoriId: record?.kategoriId ? String(record.kategoriId) : "",
    supplierId: record?.supplierId ? String(record.supplierId) : "",
    satuan: record?.satuan ?? "tablet",
    hargaBeli: record?.hargaBeli ?? 0,
    hargaJual: record?.hargaJual ?? 0,
    stokMinimum: record?.stokMinimum ?? 0,
    stokAwal: 0,
    batchNumber: "",
    tanggalExpired: "",
    lokasi: "Rak utama",
    golongan: record?.golongan ?? "bebas",
    membutuhkanResep: record?.membutuhkanResep ?? false,
    status: record?.status ?? true,
    deskripsi: record?.deskripsi ?? ""
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
        const [kategori, supplier] = await Promise.all([
          obatService.listKategoriOptions(),
          obatService.listSupplierOptions()
        ]);

        if (!active) {
          return;
        }

        setKategoriOptions(kategori);
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
      kodeObat: formValues.kodeObat,
      namaObat: formValues.namaObat,
      kategoriId: formValues.kategoriId
        ? Number(formValues.kategoriId)
        : undefined,
      supplierId: formValues.supplierId
        ? Number(formValues.supplierId)
        : undefined,
      satuan: formValues.satuan,
      hargaBeli: Number(formValues.hargaBeli || 0),
      hargaJual: Number(formValues.hargaJual || 0),
      stokMinimum: Number(formValues.stokMinimum || 0),
      golongan: formValues.golongan,
      membutuhkanResep: formValues.membutuhkanResep,
      status: formValues.status,
      deskripsi: formValues.deskripsi,
      stokAwal: Number(formValues.stokAwal || 0),
      batchNumber: formValues.batchNumber,
      tanggalExpired: formValues.tanggalExpired,
      lokasi: formValues.lokasi
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
              error={errors.kodeObat?.message}
              {...register("kodeObat", { required: "Kode obat wajib diisi" })}
            />
            <Input
              label="Nama Obat"
              placeholder="Paracetamol 500mg"
              error={errors.namaObat?.message}
              {...register("namaObat", { required: "Nama obat wajib diisi" })}
            />
            <Select
              label="Kategori"
              options={optionList("Tanpa kategori", kategoriOptions)}
              disabled={isLoadingOptions}
              {...register("kategoriId")}
            />
            <Select
              label="Supplier"
              options={optionList("Tanpa supplier", supplierOptions)}
              disabled={isLoadingOptions}
              {...register("supplierId")}
            />
            <Input label="Satuan" placeholder="tablet" {...register("satuan")} />
            <Select
              label="Golongan"
              options={[
                { label: "Bebas", value: "bebas" },
                { label: "Bebas Terbatas", value: "bebas terbatas" },
                { label: "Keras", value: "keras" }
              ]}
              {...register("golongan")}
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
              <Input
                label="Stok Awal"
                type="number"
                min={0}
                {...register("stokAwal", { valueAsNumber: true })}
              />
            ) : null}
            {!isEdit ? (
              <>
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
                <Input
                  label="Lokasi Rak"
                  placeholder="Rak utama"
                  {...register("lokasi")}
                />
              </>
            ) : null}
            <label className="flex h-10 items-center gap-3 self-end rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                {...register("membutuhkanResep")}
              />
              Membutuhkan resep
            </label>
            <label className="flex h-10 items-center gap-3 self-end rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                {...register("status")}
              />
              Aktif
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Deskripsi</span>
              <textarea
                rows={4}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Keterangan singkat obat"
                {...register("deskripsi")}
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
