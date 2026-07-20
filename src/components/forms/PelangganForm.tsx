"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Save,
  Star,
  User,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ModuleRecord } from "@/constants/modules";
import { pelangganService, type PelangganInput } from "@/services/pelangganService";

type PelangganFormValues = {
  kode: string;
  nama: string;
  telepon: string;
  email: string;
  tanggalLahir: string;
  jenisKelamin: string;
  alamat: string;
  catatanAlergi: string;
  member: boolean;
  aktif: boolean;
};

function textVal(v: ModuleRecord[string]): string {
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

export function PelangganForm({ record }: { record?: ModuleRecord }) {
  const router = useRouter();
  const isEdit = Boolean(record?.id);

  const defaultValues = useMemo<PelangganFormValues>(
    () => ({
      kode: textVal(record?.kode),
      nama: textVal(record?.nama),
      telepon: textVal(record?.telepon),
      email: textVal(record?.email),
      tanggalLahir: textVal(record?.tanggalLahir),
      jenisKelamin: textVal(record?.jenisKelamin),
      alamat: textVal(record?.alamat),
      catatanAlergi: textVal(record?.catatanAlergi),
      member: typeof record?.member === "boolean" ? record.member : false,
      aktif: typeof record?.aktif === "boolean" ? record.aktif : true
    }),
    [record]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PelangganFormValues>({ values: defaultValues });

  async function onSubmit(values: PelangganFormValues) {
    const payload: PelangganInput = {
      kode: values.kode?.trim() || undefined,
      nama: values.nama.trim(),
      telepon: values.telepon?.trim() || undefined,
      email: values.email?.trim() || undefined,
      alamat: values.alamat?.trim() || undefined,
      tanggalLahir: values.tanggalLahir || undefined,
      jenisKelamin:
        values.jenisKelamin === "L" || values.jenisKelamin === "P"
          ? values.jenisKelamin
          : undefined,
      catatanAlergi: values.catatanAlergi?.trim() || undefined,
      member: Boolean(values.member),
      aktif: Boolean(values.aktif)
    };

    try {
      if (isEdit && typeof record?.id === "string") {
        await pelangganService.update(record.id, payload);
        toast.success("Data pelanggan berhasil diperbarui");
      } else {
        await pelangganService.create(payload);
        toast.success("Pelanggan berhasil ditambahkan");
      }
      router.push("/pelanggan");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan data pelanggan"
      );
    }
  }

  return (
    <>
      <Header
        title={isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}
        description="Lengkapi data pelanggan/pasien untuk keperluan transaksi dan rekam medis."
        action={
          <Link
            href="/pelanggan"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <section className="rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]">
        {/* Banner */}
        <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f0fdf9] p-4 ring-1 ring-[#99f6e4]">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
            <Users className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-base font-black text-[#134e4a]">
              {isEdit ? "Perbarui Data Pelanggan" : "Data Pelanggan Baru"}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-[#0f766e]">
              Data akan tersimpan langsung ke database. Pastikan nama pelanggan sudah benar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ─── Identitas ─── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-stone-400" />
              <p className="text-xs font-black uppercase tracking-widest text-stone-400">
                Identitas
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Nama Lengkap"
                  placeholder="Contoh: Budi Santoso"
                  error={errors.nama?.message}
                  {...register("nama", { required: "Nama pelanggan wajib diisi" })}
                />
              </div>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span>Jenis Kelamin</span>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/10"
                  {...register("jenisKelamin")}
                >
                  <option value="">— Pilih jenis kelamin —</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-stone-400" />
                <Input
                  label="Tanggal Lahir"
                  type="date"
                  className="pl-9"
                  {...register("tanggalLahir")}
                />
              </div>
              <Input
                label="Kode (opsional)"
                placeholder="Diisi otomatis jika kosong (PLG-XXXXX)"
                {...register("kode")}
              />
            </div>
          </div>

          {/* ─── Kontak ─── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-stone-400" />
              <p className="text-xs font-black uppercase tracking-widest text-stone-400">
                Kontak
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-stone-400" />
                <Input
                  label="Nomor Telepon"
                  placeholder="08123456789"
                  className="pl-9"
                  {...register("telepon")}
                />
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-stone-400" />
                <Input
                  label="Email"
                  type="email"
                  placeholder="pelanggan@email.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              <div className="md:col-span-2">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  <span>Alamat</span>
                  <textarea
                    rows={3}
                    placeholder="Jl. Contoh No. 1, Kota"
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/10"
                    {...register("alamat")}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ─── Catatan Medis ─── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-stone-400" />
              <p className="text-xs font-black uppercase tracking-widest text-stone-400">
                Catatan Medis
              </p>
            </div>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              <span>Catatan Alergi</span>
              <textarea
                rows={3}
                placeholder="Contoh: Alergi penisilin, amoksisilin"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/10"
                {...register("catatanAlergi")}
              />
            </label>
          </div>

          {/* ─── Status ─── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-stone-400" />
              <p className="text-xs font-black uppercase tracking-widest text-stone-400">
                Status
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#0d9488] hover:bg-[#f0fdf9]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-[#0d9488]"
                  {...register("member")}
                />
                <div>
                  <p className="font-bold text-slate-800">Member</p>
                  <p className="text-xs text-slate-500">Pelanggan terdaftar sebagai member</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#0d9488] hover:bg-[#f0fdf9]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-[#0d9488]"
                  {...register("aktif")}
                />
                <div>
                  <p className="font-bold text-slate-800">Aktif</p>
                  <p className="text-xs text-slate-500">Pelanggan aktif dapat bertransaksi</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-5">
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="h-4 w-4" />
              {isEdit ? "Simpan Perubahan" : "Tambah Pelanggan"}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
