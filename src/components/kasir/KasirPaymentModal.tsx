"use client";

import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Printer,
  Wallet
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
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
import { printReceipt } from "@/utils/printReceipt";

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
  { value: "tunai", label: "Tunai", note: "Uang kas", icon: Banknote },
  { value: "transfer", label: "Transfer", note: "Bank manual", icon: Landmark },
  {
    value: "accurate",
    label: "QRIS / e-Wallet",
    note: "Link checkout",
    icon: Wallet
  }
] satisfies Array<{
  value: MetodePembayaran;
  label: string;
  note: string;
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

  async function handleCheckout(printAfterSave = false) {
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
      if (printAfterSave) {
        printReceipt(result);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan transaksi"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Pembayaran"
      panelClassName="max-w-2xl rounded-2xl"
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
          <div className="grid gap-3">
            <div className="grid min-w-0 gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <p className="text-xl font-black text-slate-950">Total</p>
              <div className="min-w-0 overflow-hidden rounded-xl border border-yellow-300 bg-yellow-300 px-4 py-3 text-right shadow-sm">
                <p className="truncate text-3xl font-black leading-none text-slate-950 sm:text-4xl">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>

            {metodePembayaran !== "accurate" ? (
              <>
                <div className="grid min-w-0 gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                  <label
                    htmlFor="nominal-bayar"
                    className="text-base font-black text-slate-900"
                  >
                    Uang Pembayaran
                  </label>
                  <div className="flex min-h-14 min-w-0 items-center rounded-xl border border-emerald-300 bg-emerald-300 px-4 text-right shadow-sm transition focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-100">
                    <span className="mr-3 text-lg font-black text-emerald-950/60">
                      Rp
                    </span>
                    <input
                      id="nominal-bayar"
                      type="number"
                      min={0}
                      value={bayar}
                      onChange={(event) => setBayar(event.target.value)}
                      className="h-12 min-w-0 flex-1 bg-transparent text-right text-3xl font-black leading-none text-emerald-950 outline-none sm:text-4xl"
                    />
                  </div>
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                  <p className="text-base font-black text-slate-900">
                    {kurang ? "Kurang Bayar" : "Kembalian"}
                  </p>
                  <div
                    className={`min-w-0 overflow-hidden rounded-xl border px-4 py-3 text-right shadow-sm ${
                      kurang
                        ? "border-red-300 bg-red-200"
                        : "border-orange-300 bg-orange-300"
                    }`}
                  >
                    <p
                      className={`truncate text-3xl font-black leading-none sm:text-4xl ${
                        kurang ? "text-red-950" : "text-orange-950"
                      }`}
                    >
                      {formatCurrency(kurang || kembalian)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid min-w-0 gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                <p className="text-base font-black text-slate-900">
                  Total Bayar
                </p>
                <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-300 bg-emerald-300 px-4 py-3 text-right shadow-sm">
                  <p className="truncate text-3xl font-black leading-none text-emerald-950 sm:text-4xl">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              {totalItems} item
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              {paymentMethods.find((item) => item.value === metodePembayaran)
                ?.label ?? "Pembayaran"}
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-black text-slate-900">
            Metode pembayaran
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {paymentMethods.map(({ value, label, note, icon: Icon }) => {
              const selected = metodePembayaran === value;

              return (
                <button
                  key={value}
                  type="button"
                  aria-label={label}
                  aria-pressed={selected}
                  disabled={value === "accurate" && hasEceranItem}
                  onClick={() => setMetodePembayaran(value)}
                  className={`group relative flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-brand-600 bg-brand-50 text-brand-700 shadow-[0_14px_34px_rgba(15,118,110,.13)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-slate-50 disabled:pointer-events-none disabled:bg-slate-50 disabled:text-slate-400"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      selected
                        ? "bg-white text-brand-700"
                        : "bg-slate-100 text-slate-500 group-hover:text-brand-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">
                      {label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-semibold opacity-70">
                      {note}
                    </span>
                  </span>
                  {selected ? (
                    <CheckCircle2
                      className="absolute right-3 top-3 h-4 w-4 text-brand-700"
                      strokeWidth={2.4}
                    />
                  ) : null}
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
            <p className="text-sm font-black text-slate-900">Nominal cepat</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickAmounts(total).map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBayar(String(amount))}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:translate-y-px"
                >
                  <span className="block truncate">
                    {amount === total ? "Uang pas" : formatCurrency(amount)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {paymentSession?.paymentUrl ? (
          <div
            className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"
            aria-live="polite"
          >
            <div className="flex items-start gap-3 text-brand-900">
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
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" />
              Buka Halaman Pembayaran
            </a>
          </div>
        ) : null}
        {metodePembayaran === "accurate" ? (
          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-brand-700 text-base font-black shadow-[0_14px_30px_rgba(15,118,110,.24)] hover:bg-brand-900 active:translate-y-px"
            isLoading={isSubmitting}
            disabled={Boolean(paymentSession?.paymentUrl)}
            onClick={() => handleCheckout()}
          >
            Buat Link Pembayaran
          </Button>
        ) : (
          <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-xl text-base font-black active:translate-y-px"
              isLoading={isSubmitting}
              disabled={kurang > 0}
              onClick={() => handleCheckout()}
            >
              Selesaikan Transaksi
            </Button>
            <Button
              type="button"
              className="h-12 rounded-xl bg-brand-700 text-base font-black shadow-[0_14px_30px_rgba(15,118,110,.24)] hover:bg-brand-900 active:translate-y-px"
              isLoading={isSubmitting}
              disabled={kurang > 0}
              onClick={() => handleCheckout(true)}
            >
              <Printer className="h-4 w-4" />
              Simpan + Cetak
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
