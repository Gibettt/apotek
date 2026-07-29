"use client";

import {
  Banknote,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Landmark,
  Wallet
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  accuratePaymentService,
  type AccuratePaymentSession
} from "@/services/accuratePaymentService";
import { pelangganService } from "@/services/pelangganService";
import { penjualanService } from "@/services/penjualanService";
import { useCabangStore } from "@/store/cabangStore";
import { useCartStore } from "@/store/cartStore";
import type { MetodePembayaran, Penjualan } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (value) => {
    const random = Math.floor(Math.random() * 16);
    const digit = value === "x" ? random : (random & 0x3) | 0x8;
    return digit.toString(16);
  });
}

const paymentMethods = [
  { value: "tunai", label: "Tunai", icon: Banknote },
  { value: "transfer", label: "Transfer", icon: Landmark },
  { value: "accurate", label: "QRIS / e-Wallet", icon: Wallet }
] satisfies Array<{
  value: MetodePembayaran;
  label: string;
  icon: typeof Banknote;
}>;

function quickAmounts(total: number) {
  return Array.from(
    new Set([
      total,
      Math.ceil(total / 10000) * 10000,
      Math.ceil(total / 50000) * 50000,
      100000
    ])
  )
    .filter((value) => value >= total && value > 0)
    .slice(0, 4);
}

export function KasirPaymentModal({
  open,
  pelangganId,
  pelangganNama,
  onClose,
  onSuccess
}: {
  open: boolean;
  pelangganId?: string;
  pelangganNama?: string;
  onClose: () => void;
  onSuccess: (penjualan: Penjualan) => void;
}) {
  const { items, subtotal, clear } = useCartStore();
  const { activeCabangId } = useCabangStore();
  const [metodePembayaran, setMetodePembayaran] =
    useState<MetodePembayaran>("tunai");
  const [bayar, setBayar] = useState(String(subtotal()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSession, setPaymentSession] =
    useState<AccuratePaymentSession | null>(null);
  const idempotencyKeyRef = useRef(createIdempotencyKey());
  const total = subtotal();
  const bayarValue = bayar === "" ? 0 : Number(bayar);
  const bayarValid = Number.isFinite(bayarValue);
  const kembalian = bayarValid ? Math.max(0, bayarValue - total) : 0;
  const kurang = bayarValid ? Math.max(0, total - bayarValue) : total;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasEceranItem = items.some((item) => item.tipeHarga === "eceran");
  const typedPelangganNama = pelangganNama?.trim() ?? "";

  useEffect(() => {
    if (open) {
      setBayar(String(total));
      setPaymentSession(null);
      idempotencyKeyRef.current = createIdempotencyKey();
    }
  }, [open, total]);

  useEffect(() => {
    if (!open || paymentSession?.status !== "PENDING") {
      return;
    }

    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const status = await accuratePaymentService.getStatus(
          paymentSession.reference
        );
        if (!active) {
          return;
        }
        setPaymentSession(status);

        if (status.status === "PAID" && status.saleId) {
          const sale = await penjualanService.getById(status.saleId);
          if (!sale || !active) {
            return;
          }
          clear();
          onSuccess(sale);
          toast.success("Pembayaran diterima dan transaksi selesai");
          onClose();
        } else if (status.status === "EXPIRED") {
          toast.error("Link pembayaran sudah kedaluwarsa");
        }
      } catch {
        // Polling berikutnya akan mencoba kembali tanpa membanjiri kasir dengan toast.
      }
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [clear, onClose, onSuccess, open, paymentSession]);

  async function handleAccurateCheckout() {
    if (pelangganId || typedPelangganNama) {
      toast.error("Pembayaran digital belum mendukung pelanggan terpilih");
      return;
    }

    if (hasEceranItem) {
      toast.error("Pembayaran digital belum mendukung item eceran");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await accuratePaymentService.create({
        idempotencyKey: idempotencyKeyRef.current,
        items: items.map((item) => ({
          barangId: item.barangId,
          quantity: item.quantity
        }))
      });
      setPaymentSession(result);
      toast.success("Link pembayaran berhasil dibuat");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal membuat link pembayaran"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resolvePelangganId() {
    if (pelangganId || !typedPelangganNama) {
      return pelangganId;
    }

    const existing = await pelangganService.list({
      search: typedPelangganNama,
      perPage: 1000
    });
    const match = existing.data.find(
      (item) =>
        item.nama.trim().toLowerCase() === typedPelangganNama.toLowerCase()
    );

    if (match) {
      return match.id;
    }

    const created = await pelangganService.create({
      nama: typedPelangganNama,
      aktif: true
    });
    return created.id;
  }

  async function handleCheckout() {
    if (metodePembayaran === "accurate") {
      await handleAccurateCheckout();
      return;
    }

    if (!Number.isFinite(bayarValue) || bayarValue < total) {
      toast.error("Nominal bayar kurang dari total transaksi");
      return;
    }

    setIsSubmitting(true);

    try {
      const resolvedPelangganId = await resolvePelangganId();
      const result = await penjualanService.checkout({
        items,
        metodePembayaran,
        bayar: bayarValue,
        pelangganId: resolvedPelangganId,
        cabangId: activeCabangId ?? undefined
      });
      clear();
      onSuccess(result);
      toast.success("Transaksi selesai");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan transaksi"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Pembayaran" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl bg-[#080c1c] p-5 text-white shadow-[0_20px_50px_rgba(8,12,28,.20)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-white/50">
                Total tagihan
              </p>
              <p className="mt-2 text-3xl font-black tracking-normal">
                {formatCurrency(total)}
              </p>
              <p className="mt-1 text-sm font-semibold text-white/60">
                {totalItems} item dalam keranjang
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-[#7dd3fc]">
              <CreditCard className="h-6 w-6" strokeWidth={1.9} />
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-black text-[#20201d]">
            Metode pembayaran
          </p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map(({ value, label, icon: Icon }) => {
              const selected = metodePembayaran === value;

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  disabled={value === "accurate" && hasEceranItem}
                  onClick={() => setMetodePembayaran(value)}
                  className={`flex h-14 items-center gap-3 rounded-lg border px-3 text-left text-sm font-black transition ${
                    selected
                      ? "border-[#0f766e] bg-emerald-50 text-[#0f766e] shadow-[0_12px_28px_rgba(15,118,110,.12)]"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-[#f8f7f3] disabled:pointer-events-none disabled:bg-stone-100 disabled:text-stone-400"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      selected ? "bg-white" : "bg-[#f8f7f3]"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {metodePembayaran === "accurate" ? (
          <Alert title="Pembayaran digital terverifikasi" variant="info">
            <p>
              Link checkout dibuat oleh Xendit. Transaksi dan stok baru
              diselesaikan setelah pembayaran terkonfirmasi, lalu faktur
              dikirim ke Accurate.
            </p>
          </Alert>
        ) : (
          <div className="space-y-3">
            <Input
              label="Nominal Bayar"
              type="number"
              min={0}
              value={bayar}
              onChange={(event) => setBayar(event.target.value)}
              className="h-14 text-lg font-black"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickAmounts(total).map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBayar(String(amount))}
                  className="h-10 rounded-lg border border-stone-200 bg-white text-sm font-black text-stone-700 transition hover:border-[#0f766e] hover:bg-emerald-50 hover:text-[#0f766e]"
                >
                  {amount === total ? "Uang pas" : formatCurrency(amount)}
                </button>
              ))}
            </div>
          </div>
        )}

        {metodePembayaran !== "accurate" ? (
          <div
            className={`rounded-xl border p-4 ${
              kurang
                ? "border-red-100 bg-red-50"
                : "border-emerald-100 bg-emerald-50"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className={`text-xs font-black uppercase ${
                    kurang ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {kurang ? "Nominal kurang" : "Kembalian"}
                </p>
                <p
                  className={`mt-1 text-3xl font-black tracking-normal ${
                    kurang ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(kurang || kembalian)}
                </p>
              </div>
              {!kurang ? (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {paymentSession?.paymentUrl ? (
          <div
            className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
            aria-live="polite"
          >
            <div className="flex items-start gap-3 text-emerald-800">
              <Wallet className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Menunggu pembayaran</p>
                <p className="mt-1 text-xs">
                  Buka checkout, lalu biarkan jendela ini terbuka sampai status
                  pembayaran diterima.
                </p>
              </div>
            </div>
            <a
              href={paymentSession.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" />
              Buka Halaman Pembayaran
            </a>
          </div>
        ) : null}
        <Button
          type="button"
          className="h-12 w-full rounded-lg bg-[#0f766e] text-base font-black hover:bg-[#115e59]"
          isLoading={isSubmitting}
          disabled={
            Boolean(paymentSession?.paymentUrl) ||
            (metodePembayaran !== "accurate" && kurang > 0)
          }
          onClick={handleCheckout}
        >
          {metodePembayaran === "accurate"
            ? "Buat Link Pembayaran"
            : "Selesaikan Transaksi"}
        </Button>
      </div>
    </Modal>
  );
}
