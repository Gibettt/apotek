"use client";

import { ArrowLeft, Building2, Mail, Phone, Save, Truck, UserRound } from "lucide-react";
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

type SupplierFormValues = SupplierInput & { kode?: string };

function textValue(value: ModuleRecord[string]) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function SupplierForm({ record }: { record?: ModuleRecord }) {
  const router = useRouter();
  const isEdit = Boolean(record?.id);

  const defaultValues = useMemo<SupplierFormValues>(
    () => ({
      kode: textValue(record?.kode),
      nama: textValue(record?.nama),
      kontakPerson: textValue(record?.kontakPerson),
      telepon: textValue(record?.telepon),
      email: textValue(record?.email),
      npwp: textValue(record?.npwp),
      alamat: textValue(record?.alamat),
      aktif: typeof record?.aktif === "boolean" ? record.aktif : true
    }),
    [record]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SupplierFormValues>({ values: defaultValues });

  async function onSubmit(values: SupplierFormValues) {
    const payload: SupplierInput = {
      kode: values.kode?.trim() || undefined,
      nama: values.nama,
      kontakPerson: values.kontakPerson || undefined,
      telepon: values.telepon || undefined,
      email: values.email || undefined,
      npwp: values.npwp || undefined,
      alamat: values.alamat || undefined,
      aktif: Boolean(values.aktif)
    };

    try {
      if (isEdit && typeof record?.id === "string") {
        await supplierService.update(record.id, payload);
        toast.success("Distributor berhasil diperbarui");
      } else {
        await supplierService.create(payload);
        toast.success("Distributor berhasil ditambahkan");
      }
      router.push("/supplier");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan distributor"
      );
    }
  }

  return (
    <>
      <Header
        title={isEdit ? "Edit Distributor" : "Tambah Distributor"}
        description="Lengkapi data distributor/supplier pengadaan barang."
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

      <section className="dashboard-surface">
        {/* Info Banner */}
        <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
            <Truck className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#20201d]">Informasi Distributor</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
              Data distributor/supplier akan tersimpan langsung ke database.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Section: Identitas */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
              Identitas
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nama Distributor"
                placeholder="Contoh: PT Sehat Farma"
                error={errors.nama?.message}
                {...register("nama", { required: "Nama distributor wajib diisi" })}
              />
              <Input
                label="Kode (opsional)"
                placeholder="Contoh: SUP-001 (diisi otomatis jika kosong)"
                {...register("kode")}
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
                  {...register("aktif")}
                />
                Aktif
              </label>
            </div>
          </div>

          {/* Section: Kontak */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
              Kontak
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-stone-400" />
                <Input
                  label="Kontak Person"
                  placeholder="Nama PIC distributor"
                  className="pl-9"
                  {...register("kontakPerson")}
                />
              </div>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-stone-400" />
                <Input
                  label="Telepon"
                  placeholder="02177889900"
                  className="pl-9"
                  {...register("telepon")}
                />
              </div>
              <div className="relative md:col-span-2">
                <Mail className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-stone-400" />
                <Input
                  label="Email"
                  type="email"
                  placeholder="sales@distributor.co.id"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
            </div>
          </div>

          {/* Section: Alamat */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
              Alamat
            </p>
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-stone-400" />
                  Alamat Lengkap
                </span>
                <textarea
                  rows={4}
                  placeholder="Jl. Contoh No. 1, Kota, Provinsi"
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  {...register("alamat")}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-5">
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="h-4 w-4" />
              {isEdit ? "Simpan Perubahan" : "Tambah Distributor"}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
