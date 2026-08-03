"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { KasirCart } from "@/components/kasir/KasirCart";
import { KasirPaymentModal } from "@/components/kasir/KasirPaymentModal";
import { KasirReceipt } from "@/components/kasir/KasirReceipt";
import { KasirSearch } from "@/components/kasir/KasirSearch";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { Pelanggan, Penjualan } from "@/types";

export default function KasirPage() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Penjualan | null>(null);
  const [stockRefreshToken, setStockRefreshToken] = useState(0);
  const [selectedPelanggan, setSelectedPelanggan] =
    useState<Pelanggan | null>(null);
  const [pelangganNama, setPelangganNama] = useState("");

  return (
    <>
      <Header
        title="Penjualan"
        description="Transaksi penjualan tanpa resep dengan keranjang, pembayaran, dan struk."
      />
      <section className="space-y-4 pb-8">
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

        <Card className="overflow-hidden">
          <CardHeader title="Keranjang">
            <p className="mt-1 text-sm font-semibold text-stone-500">
              Atur qty, hapus item, lalu lanjut pembayaran.
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <KasirCart
              pelangganId={selectedPelanggan?.id}
              pelangganNama={pelangganNama}
              onPelangganNameChange={setPelangganNama}
              onPelangganChange={setSelectedPelanggan}
              onPay={() => setPaymentOpen(true)}
            />
          </CardContent>
        </Card>

        <KasirReceipt penjualan={lastSale} />
      </section>
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
