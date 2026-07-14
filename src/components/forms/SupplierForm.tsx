"use client";

import { ArrowLeft, Save, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ModuleRecord } from "@/constants/modules";
import { supplierService, type SupplierInput } from "@/services/supplierService";

type SupplierFormValues = SupplierInput;

function textValue(value: ModuleRecord[string]) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

export function SupplierForm({ record }: { record?: ModuleRecord }) {
  const router = useRouter();
  const defaultValues = useMemo<SupplierFormValues>(
    () => ({
      namaSupplier: textValue(record?.namaSupplier),
      kontakPerson: textValue(record?.kontakPerson),
      telepon: textValue(record?.telepon),
      email: textValue(record?.email),
      npwp: textValue(record?.npwp),
      alamat: textValue(record?.alamat),
      status: typeof record?.status === "boolean" ? record.status : true
    }),
    [record]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SupplierFormValues>({ values: defaultValues });
  const isEdit = Boolean(record?.id);

  async function onSubmit(values: SupplierFormValues) {
    try {
      if (isEdit && typeof record?.id === "number") {
        await supplierService.update(record.id, values);
        toast.success("Supplier berhasil diperbarui di Supabase");
      } else {
        await supplierService.create(values);
        toast.success("Supplier berhasil ditambahkan ke Supabase");
      }

      router.push("/supplier");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan supplier ke Supabase"
      );
    }
  }

  return (
    <>
      <Header
        title={isEdit ? "Edit Supplier" : "Tambah Supplier"}
        description="Lengkapi data pemasok obat agar pembelian dan kontak operasional tersimpan rapi."
        action={
          <Link
            href="/supplier"
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
            <Truck className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#20201d]">
              Informasi Supplier
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
              Data ini akan disimpan langsung ke tabel supplier di Supabase.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nama Supplier"
              placeholder="Contoh: PT Sehat Farma"
              error={errors.namaSupplier?.message}
              {...register("namaSupplier", {
                required: "Nama supplier wajib diisi"
              })}
            />
            <Input
              label="Kontak Person"
              placeholder="Nama PIC supplier"
              {...register("kontakPerson")}
            />
            <Input
              label="Telepon"
              placeholder="02177889900"
              {...register("telepon")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="sales@supplier.co.id"
              {...register("email")}
            />
            <Input
              label="NPWP"
              placeholder="01.234.567.8-901.000"
              {...register("npwp")}
            />
            <label className="flex h-10 items-center gap-3 self-end rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                {...register("status")}
              />
              Aktif
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Alamat</span>
              <textarea
                rows={5}
                placeholder="Alamat lengkap supplier"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                {...register("alamat")}
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
