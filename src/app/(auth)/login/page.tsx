import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_480px]">
      <section className="relative hidden overflow-hidden bg-brand-900 text-white lg:block">
        <Image
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85"
          alt="Rak obat dan staf apotek"
          fill
          priority
          sizes="60vw"
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 z-10 bg-brand-900/55" />
        <div className="relative z-20 flex h-full flex-col justify-between p-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Role-based access
            </p>
            <h1 className="max-w-xl text-4xl font-bold tracking-normal">
              Operasional apotek dalam satu dashboard kerja.
            </h1>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-md bg-brand-700 text-sm font-bold text-white">
              AS
            </div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950">
              Login Apotek
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Gunakan akun staff untuk masuk ke area operasional.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
