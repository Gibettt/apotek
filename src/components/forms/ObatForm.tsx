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
  barcodeDefault: string;
  nama: string;
  kategoriId: string;
  jenisId: string;
  golonganId: string;
  pabrikId: string;
  principalId: string;
  satuanDefaultId: string;
  satuanBeliId: string;
  satuanJualId: string;
  lokasiDefaultId: string;
  supplierId: string;
  hargaBeli: number;
  hargaJual: number;
  stokMinimum: number;
  stokMaksimum: number;
  gambarUrl: string;
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
    barcodeDefault: record?.barcodeDefault ?? "",
    nama: record?.nama ?? "",
    kategoriId: record?.kategoriId ? String(record.kategoriId) : "",
    jenisId: record?.jenisId ? String(record.jenisId) : "",
    golonganId: record?.golonganId ? String(record.golonganId) : "",
    pabrikId: record?.pabrikId ? String(record.pabrikId) : "",
    principalId: record?.principalId ? String(record.principalId) : "",
    satuanDefaultId: record?.satuanDefaultId ? String(record.satuanDefaultId) : "",
    satuanBeliId: record?.satuanBeliId ? String(record.satuanBeliId) : "",
    satuanJualId: record?.satuanJualId ? String(record.satuanJualId) : "",
    lokasiDefaultId: record?.lokasiDefaultId ? String(record.lokasiDefaultId) : "",
    supplierId: "",
    hargaBeli: record?.hargaAktif?.hargaBeli ?? 0,
    hargaJual: record?.hargaAktif?.hargaJual ?? 0,
    stokMinimum: record?.stokMinimum ?? 0,
    stokMaksimum: record?.stokMaksimum ?? 0,
    gambarUrl: record?.gambarUrl ?? "",
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
  const [jenisOptions, setJenisOptions] = useState<MasterOption[]>([]);
  const [pabrikOptions, setPabrikOptions] = useState<MasterOption[]>([]);
  const [principalOptions, setPrincipalOptions] = useState<MasterOption[]>([]);
  const [lokasiOptions, setLokasiOptions] = useState<MasterOption[]>([]);
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
        const [kategori, golongan, satuan, supplier, jenis, pabrik, principal, lokasi] =
          await Promise.all([
            obatService.listKategoriOptions(),
            obatService.listGolonganOptions(),
            obatService.listSatuanOptions(),
            obatService.listSupplierOptions(),
            obatService.listJenisOptions(),
            obatService.listPabrikOptions(),
            obatService.listPrincipalOptions(),
            obatService.listLokasiOptions()
          ]);

        if (!active) {
          return;
        }

        setKategoriOptions(kategori);
        setGolonganOptions(golongan);
        setSatuanOptions(satuan);
        setSupplierOptions(supplier);
        setJenisOptions(jenis);
        setPabrikOptions(pabrik);
        setPrincipalOptions(principal);
        setLokasiOptions(lokasi);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat master data barang"
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
      barcodeDefault: formValues.barcodeDefault || undefined,
      nama: formValues.nama,
      kategoriId: formValues.kategoriId || undefined,
      jenisId: formValues.jenisId || undefined,
      golonganId: formValues.golonganId || undefined,
      pabrikId: formValues.pabrikId || undefined,
      principalId: formValues.principalId || undefined,
      satuanDefaultId: formValues.satuanDefaultId || undefined,
      satuanBeliId: formValues.satuanBeliId || undefined,
      satuanJualId: formValues.satuanJualId || undefined,
      lokasiDefaultId: formValues.lokasiDefaultId || undefined,
      supplierId: formValues.supplierId || undefined,
      hargaBeli: Number(formValues.hargaBeli || 0),
      hargaJual: Number(formValues.hargaJual || 0),
      stokMinimum: Number(formValues.stokMinimum || 0),
      stokMaksimum: Number(formValues.stokMaksimum || 0),
      gambarUrl: formValues.gambarUrl,
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
        toast.success("Barang berhasil diperbarui di Supabase");
      } else {
        await obatService.create(payload);
        toast.success("Barang berhasil ditambahkan ke Supabase");
      }

      router.push("/obat");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan barang"
      );
    }
  }

  return (
    <>
      <Header
        title={isEdit ? "Edit Barang" : "Tambah Barang"}
        description="Simpan data barang langsung ke Supabase. Stok awal akan dicatat sebagai batch stok pertama."
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

      <section className="dashboard-surface">
        <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <Pill className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#20201d]">
              Informasi Barang
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
              label="Kode Barang"
              placeholder="OBT-0001"
              error={errors.kode?.message}
              {...register("kode", { required: "Kode barang wajib diisi" })}
            />
            <Input
              label="Nama Barang"
              placeholder="Paracetamol 500mg"
              error={errors.nama?.message}
              {...register("nama", { required: "Nama barang wajib diisi" })}
            />
            <Input
              label="Barcode"
              placeholder="899xxxxxxxxxx"
              {...register("barcodeDefault")}
            />
            <Select
              label="Kategori"
              options={optionList("Tanpa kategori", kategoriOptions)}
              disabled={isLoadingOptions}
              {...register("kategoriId")}
            />
            <Select
              label="Jenis Barang"
              options={optionList("Tanpa jenis", jenisOptions)}
              disabled={isLoadingOptions}
              {...register("jenisId")}
            />
            <Select
              label="Golongan"
              options={optionList("Tanpa golongan", golonganOptions)}
              disabled={isLoadingOptions}
              {...register("golonganId")}
            />
            <Select
              label="Pabrik"
              options={optionList("Tanpa pabrik", pabrikOptions)}
              disabled={isLoadingOptions}
              {...register("pabrikId")}
            />
            <Select
              label="Principal"
              options={optionList("Tanpa principal", principalOptions)}
              disabled={isLoadingOptions}
              {...register("principalId")}
            />
            <Select
              label="Lokasi Simpan"
              options={optionList("Tanpa lokasi", lokasiOptions)}
              disabled={isLoadingOptions}
              {...register("lokasiDefaultId")}
            />
            <Select
              label="Satuan"
              options={optionList("Pilih satuan", satuanOptions)}
              disabled={isLoadingOptions}
              {...register("satuanDefaultId")}
            />
            <Select
              label="Satuan Beli"
              options={optionList("Sama dengan satuan", satuanOptions)}
              disabled={isLoadingOptions}
              {...register("satuanBeliId")}
            />
            <Select
              label="Satuan Jual"
              options={optionList("Sama dengan satuan", satuanOptions)}
              disabled={isLoadingOptions}
              {...register("satuanJualId")}
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
            <Input
              label="Stok Maksimum"
              type="number"
              min={0}
              {...register("stokMaksimum", { valueAsNumber: true })}
            />
            <div className="md:col-span-2">
              <Input
                label="URL Gambar"
                placeholder="https://..."
                {...register("gambarUrl")}
              />
            </div>
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
              <span>Indikasi</span>
              <textarea
                rows={3}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Kegunaan barang"
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
