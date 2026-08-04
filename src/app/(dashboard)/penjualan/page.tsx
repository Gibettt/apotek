"use client";

import Link from "next/link";
import { RotateCcw, ShoppingCart, ReceiptText } from "lucide-react";
import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

const penjualanActions = [
  {
    label: "Kasir",
    description: "Buat transaksi penjualan baru.",
    href: "/penjualan/kasir",
    icon: ShoppingCart
  },
  {
    label: "Riwayat Transaksi",
    description: "Lihat transaksi penjualan yang sudah tersimpan.",
    href: "/penjualan",
    icon: ReceiptText
  },
  {
    label: "Retur Penjualan",
    description: "Proses pengembalian barang dari pelanggan.",
    href: "/retur-penjualan",
    icon: RotateCcw
  }
];

export default function PenjualanPage() {
  return (
    <ModuleListPage
      config={{
        ...moduleConfigs.penjualan,
        addPath: undefined
      }}
      beforeContent={
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {penjualanActions.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-stone-200 bg-white p-4 shadow-[0_14px_36px_rgba(31,41,35,0.06)] transition hover:border-[#0f766e]/40 hover:bg-[#f7fcfa]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e8f4ef] text-[#267d6b]">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm font-black text-[#20201d]">{label}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">
                {description}
              </p>
            </Link>
          ))}
        </div>
      }
    />
  );
}
