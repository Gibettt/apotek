"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { KasirCart } from "@/components/kasir/KasirCart";
import { KasirPageShell } from "@/components/kasir/KasirPageShell";
import { KasirPaymentModal } from "@/components/kasir/KasirPaymentModal";
import { KasirSearch } from "@/components/kasir/KasirSearch";
import { useCartStore } from "@/store/cartStore";
import type { Pelanggan } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

export default function KasirPage() {
  const cartItems = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [stockRefreshToken, setStockRefreshToken] = useState(0);
  const [selectedPelanggan, setSelectedPelanggan] =
    useState<Pelanggan | null>(null);
  const [pelangganNama, setPelangganNama] = useState("");
  const [productTotal, setProductTotal] = useState(0);
  const [pelangganTotal, setPelangganTotal] = useState(0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <KasirPageShell active="kasir">
          <div className="grid min-h-0 flex-1 gap-2 overflow-hidden rounded-b-[16px] bg-[#151514] lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_365px]">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#e6f3c4] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black">Order Line</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{totalItems}</span>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black text-[#555f35]">
                  All Orders
                </span>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Transaksi", "Baru", "Aktif"],
                  ["Pelanggan", String(pelangganTotal), "Terdaftar"],
                  ["Item", String(productTotal), "Barang tampil"],
                  ["Total", String(subtotal()), "Belanja"]
                ].map(([title, value, status]) => (
                  <div key={title} className="rounded-[16px] bg-white p-3 shadow-[0_12px_24px_rgba(48,57,30,0.08)]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-black">{title}</p>
                      <span className="text-[10px] font-bold text-stone-400">#{String(title).slice(0, 3).toUpperCase()}</span>
                    </div>
                    <p className="mt-2 truncate text-xs font-bold text-stone-500">{value}</p>
                    <span className="mt-3 inline-flex rounded-full bg-[#e6f3c4] px-2.5 py-1 text-[10px] font-black text-[#3b4c16]">
                      {status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-black">Explore Obat</p>
                  <p className="text-xs font-bold text-[#59633d]">Harga dan stok langsung dari Supabase.</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <KasirSearch
                  refreshToken={stockRefreshToken}
                  onTotalChange={setProductTotal}
                />
              </div>
            </div>

            <aside className="flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#cbb8ff]">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-lg font-black text-[#171717]">Order Details</p>
                  <p className="text-xs font-bold text-[#55458a]">Kasir penjualan</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/55 text-[#171717]">
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.9} />
                </span>
              </div>
              <KasirCart
                pelangganId={selectedPelanggan?.id}
                pelangganNama={pelangganNama}
                onPelangganNameChange={setPelangganNama}
                onPelangganTotalChange={setPelangganTotal}
                onPelangganChange={setSelectedPelanggan}
                onPay={() => setPaymentOpen(true)}
              />
            </aside>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 bg-[#151514] px-4 py-2 text-xs font-bold text-white/50 lg:hidden">
            <span>{totalItems} item</span>
            <span>Data produk, stok, dan transaksi dari Supabase</span>
          </footer>
      </KasirPageShell>
      <KasirPaymentModal
        open={paymentOpen}
        pelangganId={selectedPelanggan?.id}
        pelangganNama={pelangganNama}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => {
          setSelectedPelanggan(null);
          setPelangganNama("");
          setStockRefreshToken((token) => token + 1);
        }}
      />
    </>
  );
}
