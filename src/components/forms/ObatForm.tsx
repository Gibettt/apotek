"use client";

import { ArrowLeft, Pill, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  obatService,
  type MasterOption,
  toObatUpdatePayload,
  type ObatListItem
} from "@/services/obatService";
import { formatCurrency } from "@/utils/formatCurrency";

interface ObatFormValues {
  hargaJual: number;
  eceranEnabled: boolean;
  satuanEceranId: string;
  isiPerSatuan: number;
  hargaJualEceran: number;
}

export function ObatForm({ record }: { record: ObatListItem }) {
  const router = useRouter();
  const [satuanOptions, setSatuanOptions] = useState<MasterOption[]>([]);
  const [isLoadingSatuan, setIsLoadingSatuan] = useState(true);
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting }
  } = useForm<ObatFormValues>({
    values: {
      hargaJual: record.hargaAktif?.hargaJual ?? 0,
      eceranEnabled: Boolean(record.eceran),
      satuanEceranId: record.eceran?.satuanId ?? "",
      isiPerSatuan: record.eceran?.isiPerSatuan ?? 10,
      hargaJualEceran: record.eceran?.hargaJual ?? 0
    }
  });
  const eceranEnabled = watch("eceranEnabled");

  useEffect(() => {
    let active = true;

    async function loadSatuan() {
      try {
        const options = await obatService.listSatuanOptions();
        if (active) {
          setSatuanOptions(options);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat satuan"
          );
        }
      } finally {
        if (active) {
          setIsLoadingSatuan(false);
        }
      }
    }

    void loadSatuan();

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(formValues: ObatFormValues) {
    if (formValues.eceranEnabled) {
      if (!record.satuanDefaultId) {
        toast.error("Satuan utama barang belum tersedia");
        return;
      }

      if (!formValues.satuanEceranId) {
        toast.error("Satuan eceran wajib dipilih");
        return;
      }

      if (formValues.satuanEceranId === record.satuanDefaultId) {
        toast.error("Satuan eceran harus berbeda dari satuan utama");
        return;
      }

      if (Number(formValues.isiPerSatuan || 0) <= 1) {
        toast.error("Isi per satuan harus lebih dari 1");
        return;
      }
    }

    const payload = toObatUpdatePayload(record, {
      hargaJual: Number(formValues.hargaJual || 0),
      eceran: formValues.eceranEnabled
        ? {
            enabled: true,
            satuanEceranId: formValues.satuanEceranId,
            isiPerSatuan: Number(formValues.isiPerSatuan || 0),
            hargaJual: Number(formValues.hargaJualEceran || 0)
          }
        : {
            enabled: false,
            satuanEceranId: record.eceran?.satuanId
          }
    });

    try {
      await obatService.update(record.id, payload);
      toast.success("Pengaturan jual barang berhasil diperbarui");
      router.push("/obat");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan harga jual"
      );
    }
  }

  return (
    <>
      <Header
        title="Atur Harga Jual"
        description="Data barang otomatis masuk dari Pembelian. Di sini tinggal atur harga jualnya."
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

      <section className="max-w-xl dashboard-surface">
        <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <Pill className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-[#20201d]">
              {record.nama}
            </p>
            <p className="mt-1 text-xs font-semibold text-stone-400">
              Kode: {record.kode} &middot; Harga Beli:{" "}
              {formatCurrency(record.hargaAktif?.hargaBeli ?? 0)} &middot;
              Satuan utama: {record.satuanNama ?? "-"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Harga Jual"
            type="number"
            min={0}
            {...register("hargaJual", { valueAsNumber: true })}
          />

          <label className="flex items-center gap-3 rounded-lg border border-stone-200 bg-[#f8f7f3] px-4 py-3 text-sm font-bold text-stone-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 text-[#0f766e] focus:ring-[#0f766e]"
              {...register("eceranEnabled")}
            />
            Bisa dijual eceran
          </label>

          {eceranEnabled ? (
            <div className="grid gap-4 rounded-lg border border-stone-200 p-4 md:grid-cols-2">
              <Select
                label="Satuan Eceran"
                disabled={isLoadingSatuan}
                {...register("satuanEceranId")}
                options={[
                  { label: "Pilih satuan eceran", value: "" },
                  ...satuanOptions.map((satuan) => ({
                    label: satuan.label,
                    value: satuan.id
                  }))
                ]}
              />
              <Input
                label={`Isi per ${record.satuanNama ?? "satuan"}`}
                type="number"
                min={2}
                {...register("isiPerSatuan", { valueAsNumber: true })}
              />
              <Input
                label="Harga Jual Eceran"
                type="number"
                min={0}
                className="md:col-span-2"
                {...register("hargaJualEceran", { valueAsNumber: true })}
              />
            </div>
          ) : null}

          <div className="flex justify-end border-t border-stone-100 pt-5">
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="h-4 w-4" />
              Simpan Harga
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
