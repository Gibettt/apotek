import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BadgeCheck, ClipboardList, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function DaftarPage() {
  return (
    <main className="grid min-h-[100dvh] bg-[#f5f8f7] lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
      <section className="relative hidden overflow-hidden bg-brand-900 text-white lg:block">
        <Image
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85"
          alt="Rak obat dan staf apotek"
          fill
          priority
          sizes="60vw"
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(115deg,rgba(7,54,50,0.94),rgba(15,118,110,0.72)_48%,rgba(226,103,63,0.26))]" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-[#062f2b] to-transparent" />
        <div className="relative z-20 flex h-full min-h-[100dvh] flex-col justify-between p-10 xl:p-12">
          <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.15] bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/[0.18]">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>

          <div className="max-w-2xl">
            <div className="mb-7 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/[0.15] bg-white/[0.12] p-4 backdrop-blur">
                <UserPlus className="mb-5 h-5 w-5 text-brand-100" />
                <p className="text-2xl font-bold">Baru</p>
                <p className="mt-1 text-xs font-medium text-white/70">Akun kasir</p>
              </div>
              <div className="rounded-2xl border border-white/[0.15] bg-white/[0.12] p-4 backdrop-blur">
                <ShieldCheck className="mb-5 h-5 w-5 text-brand-100" />
                <p className="text-2xl font-bold">Role</p>
                <p className="mt-1 text-xs font-medium text-white/70">Kasir aman</p>
              </div>
              <div className="rounded-2xl border border-white/[0.15] bg-white/[0.12] p-4 backdrop-blur">
                <ClipboardList className="mb-5 h-5 w-5 text-brand-100" />
                <p className="text-2xl font-bold">Siap</p>
                <p className="mt-1 text-xs font-medium text-white/70">Transaksi</p>
              </div>
            </div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-white/[0.12] px-3 py-1.5 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#ffd7a8]" />
              Pendaftaran staff apotek
            </p>
            <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-normal">
              Daftar sebagai kasir untuk mulai transaksi harian.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
              Buat akses kasir agar transaksi, pembayaran, dan aktivitas harian tercatat rapi.
            </p>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden px-5 py-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.12),transparent_34%,rgba(226,103,63,0.08))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,78,74,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,78,74,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />

        <div className="relative w-full max-w-md">
          <div className="mb-7">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-soft transition hover:-translate-y-0.5 hover:text-brand-900 lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>

            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-700 text-sm font-bold text-white shadow-[0_18px_45px_rgba(15,118,110,0.24)]">
                AS
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
                <BadgeCheck className="h-3.5 w-3.5" />
                Role kasir
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-slate-950">
              Daftar Akun Kasir
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Buat akun untuk masuk sebagai kasir di dashboard apotek.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/80 bg-white/[0.86] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <RegisterForm />
            <p className="mt-6 text-center text-sm text-slate-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-brand-700 transition hover:text-brand-900 hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
