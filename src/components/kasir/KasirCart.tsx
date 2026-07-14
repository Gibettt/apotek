"use client";

import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/formatCurrency";

export function KasirCart({ onPay }: { onPay: () => void }) {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = subtotal();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
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

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.obatId}
              className="rounded-lg border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-[0_16px_34px_rgba(25,24,21,.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#20201d]">
                    {item.namaObat}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-500">
                    {formatCurrency(item.hargaJual)} / item
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Hapus ${item.namaObat}`}
                  onClick={() => removeItem(item.obatId)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[138px_1fr] sm:items-center">
                <div className="flex h-10 items-center overflow-hidden rounded-lg border border-stone-200 bg-[#f8f7f3]">
                  <button
                    type="button"
                    aria-label={`Kurangi ${item.namaObat}`}
                    onClick={() =>
                      updateQuantity(item.obatId, item.quantity - 1)
                    }
                    className="grid h-full w-10 place-items-center text-stone-500 transition hover:bg-white hover:text-stone-950"
                  >
                    <Minus className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <input
                    aria-label={`Qty ${item.namaObat}`}
                    type="number"
                    min={1}
                    max={item.stokTersedia}
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(item.obatId, Number(event.target.value))
                    }
                    className="h-full w-14 border-x border-stone-200 bg-white text-center text-sm font-black text-[#20201d] outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Tambah qty ${item.namaObat}`}
                    onClick={() =>
                      updateQuantity(item.obatId, item.quantity + 1)
                    }
                    className="grid h-full w-10 place-items-center text-stone-500 transition hover:bg-white hover:text-stone-950"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-400">Subtotal</p>
                  <p className="text-lg font-black text-[#20201d]">
                    {formatCurrency(item.hargaJual * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))
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
