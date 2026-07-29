"use client";

import { ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { KasirCart } from "@/components/kasir/KasirCart";
import { KasirPaymentModal } from "@/components/kasir/KasirPaymentModal";
import { KasirReceipt } from "@/components/kasir/KasirReceipt";
import { KasirSearch } from "@/components/kasir/KasirSearch";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useCartStore } from "@/store/cartStore";
import type { Pelanggan, Penjualan } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

export default function KasirPage() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Penjualan | null>(null);
  const [stockRefreshToken, setStockRefreshToken] = useState(0);
  const [selectedPelanggan, setSelectedPelanggan] =
    useState<Pelanggan | null>(null);
  const [pelangganNama, setPelangganNama] = useState("");
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Header
        title="Penjualan"
        description="Transaksi penjualan tanpa resep dengan keranjang, pembayaran, dan struk."
      />
      <section className="space-y-4 pb-28">
        <Card className="overflow-hidden">
          <CardHeader title="Cari Obat">
            <p className="mt-1 text-sm font-semibold text-stone-500">
              Data obat diambil langsung dari Supabase stok obat.
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <KasirSearch refreshToken={stockRefreshToken} />
          </CardContent>
        </Card>
        <KasirReceipt penjualan={lastSale} />
      </section>
      {cartOpen ? (
        <div className="fixed inset-0 z-40 bg-[#20201d]/35 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Tutup keranjang"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setCartOpen(false)}
          />
          <aside className="absolute bottom-0 right-0 top-auto flex max-h-[88vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_-22px_70px_rgba(25,24,21,.25)] sm:bottom-5 sm:right-5 sm:top-5 sm:max-h-none sm:w-[420px] sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-[#20201d]">Keranjang</h2>
                <p className="mt-1 text-sm font-semibold text-stone-500">
                  Atur qty, hapus item, lalu lanjut pembayaran.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup keranjang"
                onClick={() => setCartOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f8f7f3] text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <KasirCart
                pelangganId={selectedPelanggan?.id}
                pelangganNama={pelangganNama}
                onPelangganNameChange={setPelangganNama}
                onPelangganChange={setSelectedPelanggan}
                onPay={() => {
                  setCartOpen(false);
                  setPaymentOpen(true);
                }}
              />
            </div>
          </aside>
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Buka keranjang"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex h-16 items-center gap-3 rounded-full bg-[#20201d] px-5 text-white shadow-[0_20px_50px_rgba(25,24,21,.28)] transition hover:-translate-y-1 hover:bg-black focus:outline-none focus:ring-4 focus:ring-[#ff6a3d]/20"
      >
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[#ff6a3d] text-white">
          <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
          {totalItems ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-black text-[#20201d]">
              {totalItems}
            </span>
          ) : null}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-bold text-white/60">Keranjang</span>
          <span className="block text-sm font-black">{formatCurrency(subtotal())}</span>
        </span>
      </button>
      <KasirPaymentModal
        open={paymentOpen}
        pelangganId={selectedPelanggan?.id}
        pelangganNama={pelangganNama}
        onClose={() => setPaymentOpen(false)}
        onSuccess={(penjualan) => {
          setLastSale(penjualan);
          setSelectedPelanggan(null);
          setPelangganNama("");
          setStockRefreshToken((token) => token + 1);
        }}
      />
    </>
  );
}
