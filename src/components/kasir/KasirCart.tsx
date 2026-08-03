"use client";

import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react";
import { KasirPelangganPicker } from "@/components/kasir/KasirPelangganPicker";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cartStore";
import type { Pelanggan } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

export function KasirCart({
  pelangganId,
  pelangganNama,
  onPelangganNameChange,
  onPelangganChange,
  onPay
}: {
  pelangganId?: string;
  pelangganNama?: string;
  onPelangganNameChange?: (nama: string) => void;
  onPelangganChange?: (pelanggan: Pelanggan | null) => void;
  onPay: () => void;
}) {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = subtotal();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {onPelangganChange ? (
        <KasirPelangganPicker
          pelangganId={pelangganId}
          pelangganNama={pelangganNama}
          onNameChange={onPelangganNameChange}
          onChange={onPelangganChange}
        />
      ) : null}

      <div className="flex items-center justify-between rounded-lg bg-[#f8f7f3] px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase text-stone-400">
            Item keranjang
          </p>
          <p className="mt-1 text-lg font-black text-[#20201d]">
            {totalItems} item
          </p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-[#ff6a3d] shadow-sm">
          <ReceiptText className="h-5 w-5" strokeWidth={1.9} />
        </span>
      </div>

      <div className="max-h-[420px] overflow-y-auto pr-1">
        {items.length ? (
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="min-w-[980px] text-left text-sm">
              <thead className="bg-[#f8f7f3] text-xs font-black uppercase text-stone-500">
                <tr>
                  <th className="w-12 px-3 py-3">No</th>
                  <th className="w-32 px-3 py-3">Kode Barang</th>
                  <th className="w-56 px-3 py-3">Nama Barang</th>
                  <th className="w-40 px-3 py-3 text-center">Jumlah</th>
                  <th className="w-28 px-3 py-3">Satuan</th>
                  <th className="w-32 px-3 py-3 text-right">Harga</th>
                  <th className="w-28 px-3 py-3 text-right">Pajak</th>
                  <th className="w-36 px-3 py-3 text-right">Total</th>
                  <th className="w-28 px-3 py-3 text-right">Diskon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item, index) => {
                  const cartKey = item.cartKey ?? item.barangId;
                  const maxQuantity = Math.floor(
                    item.stokTersedia / (item.stockQtyPerUnit ?? 1)
                  );
                  const lineTotal = item.hargaJual * item.quantity;
                  const lineTax = 0;
                  const lineDiscount = 0;

                  return (
                    <tr
                      key={cartKey}
                      className="align-middle text-stone-700 transition hover:bg-[#f8f7f3]"
                    >
                      <td className="px-3 py-3 font-black text-[#20201d]">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 font-semibold text-stone-600">
                        {item.kode || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-black text-[#20201d]">
                            {item.nama}
                          </span>
                          <button
                            type="button"
                            aria-label={`Hapus ${item.nama}`}
                            onClick={() => removeItem(cartKey)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="mx-auto flex h-9 w-32 items-center overflow-hidden rounded-lg border border-stone-200 bg-[#f8f7f3]">
                          <button
                            type="button"
                            aria-label={`Kurangi ${item.nama}`}
                            onClick={() =>
                              updateQuantity(cartKey, item.quantity - 1)
                            }
                            className="grid h-full w-9 place-items-center text-stone-500 transition hover:bg-white hover:text-stone-950"
                          >
                            <Minus className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <input
                            aria-label={`Qty ${item.nama}`}
                            type="number"
                            min={1}
                            max={maxQuantity}
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(cartKey, Number(event.target.value))
                            }
                            className="h-full w-14 border-x border-stone-200 bg-white text-center text-sm font-black text-[#20201d] outline-none"
                          />
                          <button
                            type="button"
                            aria-label={`Tambah qty ${item.nama}`}
                            onClick={() =>
                              updateQuantity(cartKey, item.quantity + 1)
                            }
                            className="grid h-full w-9 place-items-center text-stone-500 transition hover:bg-white hover:text-stone-950"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-stone-600">
                        {item.satuanNama || "item"}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-stone-700">
                        {formatCurrency(item.hargaJual)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-stone-500">
                        {formatCurrency(lineTax)}
                      </td>
                      <td className="px-3 py-3 text-right font-black text-[#20201d]">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-stone-500">
                        {formatCurrency(lineDiscount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-stone-200 bg-[#f8f7f3] p-8 text-center">
            <p className="text-sm font-black text-[#20201d]">
              Keranjang masih kosong.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-500">
              Pilih obat di panel kiri untuk mulai transaksi.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-[#080c1c] p-4 text-white shadow-[0_24px_60px_rgba(8,12,28,.18)]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-white/65">Total</span>
          <span className="text-2xl font-black tracking-normal">
            {formatCurrency(total)}
          </span>
        </div>
        <Button
          type="button"
          className="mt-4 h-11 w-full rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]"
          disabled={!items.length}
          onClick={onPay}
        >
          Bayar
        </Button>
      </div>
    </div>
  );
}
