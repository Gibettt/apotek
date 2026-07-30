import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Pill,
  ReceiptText,
  ShieldCheck,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const modules = [
  {
    title: "Stok real-time",
    description: "Batch, lokasi rak, minimum stok, mutasi, dan expired.",
    icon: Boxes
  },
  {
    title: "POS kasir",
    description: "Keranjang, pembayaran, kembalian, dan struk thermal-ready.",
    icon: ShoppingCart
  },
  {
    title: "Resep dokter",
    description: "Input resep, verifikasi apoteker, lalu proses ke penjualan.",
    icon: ClipboardCheck
  },
  {
    title: "Laporan",
    description: "Penjualan, pembelian, stok, laba rugi, dan export operasional.",
    icon: BarChart3
  }
];

export default function HomePage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="relative min-h-[78svh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1800&q=85"
          alt="Etalase dan rak obat di apotek modern"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent" />
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-600 text-sm font-bold">
              AS
            </div>
            <span className="text-sm font-bold">Apotek Ananda</span>
          </Link>
          <Link href="/login">
            <Button variant="secondary">
              Login
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </header>

        <div className="relative z-20 mx-auto flex max-w-7xl px-5 pb-12 pt-20 md:pt-28">
          <div className="max-w-3xl text-white">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Owner, Admin, Apoteker, Kasir
            </p>
            <h1 className="text-4xl font-bold tracking-normal md:text-6xl">
              Apotek Ananda
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 md:text-lg">
              Sistem kerja apotek untuk obat, stok, pembelian, penjualan,
              resep, notifikasi, dan laporan keuangan harian.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button size="lg">
                  Buka Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/penjualan/kasir">
                <Button size="lg" variant="secondary">
                  Coba POS
                  <ReceiptText className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <article
              key={module.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <Icon className="mb-4 h-6 w-6 text-brand-700" />
              <h2 className="text-base font-semibold text-slate-950">
                {module.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {module.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Pill className="mb-4 h-8 w-8 text-brand-700" />
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
              Fondasi sudah disiapkan untuk aplikasi role-based.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Frontend menggunakan Next.js App Router, Tailwind, Zustand,
              TanStack Query, React Hook Form, Zod, Sonner, Recharts, dan
              Supabase client.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["CRUD Obat", "Supplier", "Pembelian", "Laporan", "User & Role", "Pengaturan"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
