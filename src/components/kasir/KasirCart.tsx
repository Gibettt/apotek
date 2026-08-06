"use client";

import { Minus, Plus, ReceiptText, Trash2, UserRound } from "lucide-react";
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
  onPelangganTotalChange,
  onPay
}: {
  pelangganId?: string;
  pelangganNama?: string;
  onPelangganNameChange?: (nama: string) => void;
  onPelangganChange?: (pelanggan: Pelanggan | null) => void;
  onPelangganTotalChange?: (total: number) => void;
  onPay: () => void;
}) {
  const { items, removeItem, updateQuantity, clear, subtotal } = useCartStore();
  const total = subtotal();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full min-h-0 flex-col text-[#171717]">
      {onPelangganChange ? (
        <div className="px-4 pb-3">
          <KasirPelangganPicker
            pelangganId={pelangganId}
            pelangganNama={pelangganNama}
            onNameChange={onPelangganNameChange}
            onTotalChange={onPelangganTotalChange}
            onChange={onPelangganChange}
          />
        </div>
      ) : null}

      <div className="mx-4 mb-3 flex items-center justify-between rounded-[14px] bg-white/50 px-3 py-2">
        <div>
          <p className="text-[11px] font-bold text-[#55458a]">Order aktif</p>
          <p className="mt-1 text-lg font-black text-[#20201d]">
            {totalItems} item
          </p>
        </div>
        {items.length ? (
          <button
            type="button"
            aria-label="Kosongkan keranjang"
            onClick={clear}
            className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} />
            Kosongkan
          </button>
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#55458a]">
            <ReceiptText className="h-5 w-5" strokeWidth={1.9} />
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const cartKey = item.cartKey ?? item.barangId;
              const maxQuantity = Math.floor(
                item.stokTersedia / (item.stockQtyPerUnit ?? 1)
              );
              const lineTotal = item.hargaJual * item.quantity;

              return (
                <div
                  key={cartKey}
                  className="rounded-[16px] bg-white p-3 shadow-[0_12px_24px_rgba(60,42,120,0.12)]"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#20201d]">
                        {item.nama}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-stone-500">
                        {item.kode || "-"} - {item.satuanNama || "item"}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Hapus ${item.nama}`}
                      onClick={() => removeItem(cartKey)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f1ebff] text-[#55458a] transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex h-8 w-28 items-center overflow-hidden rounded-full bg-[#edf6d0]">
                      <button
                        type="button"
                        aria-label={`Kurangi ${item.nama}`}
                        onClick={() => updateQuantity(cartKey, item.quantity - 1)}
                        className="grid h-full w-8 place-items-center text-[#171717] transition hover:bg-white"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
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
                        className="h-full w-12 bg-white text-center text-xs font-black text-[#20201d] outline-none"
                      />
                      <button
                        type="button"
                        aria-label={`Tambah qty ${item.nama}`}
                        onClick={() => updateQuantity(cartKey, item.quantity + 1)}
                        className="grid h-full w-8 place-items-center text-[#171717] transition hover:bg-white"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="truncate text-xs font-semibold text-stone-500">
                        {formatCurrency(item.hargaJual)}
                      </p>
                      <p className="truncate text-base font-black text-[#20201d]">
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-[260px] place-items-center rounded-[16px] border border-dashed border-white/70 bg-white/35 p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#55458a] shadow-sm">
              <UserRound className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <p className="text-sm font-black text-[#20201d]">
              Keranjang masih kosong.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-500">
              Pilih obat di panel kiri untuk mulai transaksi.
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#cbb8ff] p-4">
        <div className="space-y-2 rounded-[14px] bg-white/45 p-3 text-sm font-bold text-[#55458a]">
          <div className="flex items-center justify-between gap-4">
            <span>Subtotal</span>
            <span className="text-[#20201d]">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Diskon</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Pajak</span>
            <span>{formatCurrency(0)}</span>
          </div>
        </div>
        <div className="mt-3 rounded-[14px] bg-white px-4 py-3 text-[#171717]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-black">Total Payment</span>
            <span className="text-2xl font-black tracking-normal">
              {formatCurrency(total)}
            </span>
          </div>
          <Button
            type="button"
            className="mt-3 h-11 w-full rounded-full bg-[#151514] text-sm font-black text-white hover:bg-black active:translate-y-px"
            disabled={!items.length}
            onClick={onPay}
          >
            Bayar Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
