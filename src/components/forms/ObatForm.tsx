"use client";

import { ArrowLeft, Pill, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  obatService,
  toObatUpdatePayload,
  type ObatListItem
} from "@/services/obatService";
import { formatCurrency } from "@/utils/formatCurrency";

interface ObatFormValues {
  hargaJual: number;
}

export function ObatForm({ record }: { record: ObatListItem }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<ObatFormValues>({
    values: { hargaJual: record.hargaAktif?.hargaJual ?? 0 }
  });

  async function onSubmit(formValues: ObatFormValues) {
    const payload = toObatUpdatePayload(record, {
      hargaJual: Number(formValues.hargaJual || 0)
    });

    try {
      await obatService.update(record.id, payload);
      toast.success("Harga jual berhasil diperbarui");
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
              {formatCurrency(record.hargaAktif?.hargaBeli ?? 0)}
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
