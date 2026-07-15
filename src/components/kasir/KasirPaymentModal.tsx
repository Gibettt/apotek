"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  accuratePaymentService,
  type AccuratePaymentSession
} from "@/services/accuratePaymentService";
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

export function KasirPaymentModal({
  open,
  onClose,
  onSuccess
}: {
  open: boolean;
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
  const kembalian = Math.max(0, bayarValue - total);

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
      const result = await penjualanService.checkout({
        items,
        metodePembayaran,
        bayar: bayarValue,
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
      <div className="space-y-4">
        <Select
          label="Metode Pembayaran"
          value={metodePembayaran}
          onChange={(event) =>
            setMetodePembayaran(event.target.value as MetodePembayaran)
          }
          options={[
            { label: "Tunai", value: "tunai" },
            { label: "Transfer", value: "transfer" },
            { label: "BPJS", value: "BPJS" },
            {
              label: "Accurate e-Payment (QRIS / e-Wallet)",
              value: "accurate"
            }
          ]}
        />
        {metodePembayaran === "accurate" ? (
          <Alert title="Pembayaran digital terverifikasi" variant="info">
            <p>
              Link checkout dibuat oleh Xendit. Transaksi dan stok baru
              diselesaikan setelah pembayaran terkonfirmasi, lalu faktur
              dikirim ke Accurate.
            </p>
          </Alert>
        ) : (
          <Input
            label="Nominal Bayar"
            type="number"
            min={0}
            value={bayar}
            onChange={(event) => setBayar(event.target.value)}
          />
        )}
        <div className="grid gap-2 rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          {metodePembayaran !== "accurate" ? (
            <div className="flex justify-between">
              <span>Kembalian</span>
              <strong>{formatCurrency(kembalian)}</strong>
            </div>
          ) : null}
        </div>
        {paymentSession?.paymentUrl ? (
          <div
            className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
            aria-live="polite"
          >
            <div className="flex items-start gap-3 text-emerald-800">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
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
          className="w-full"
          isLoading={isSubmitting}
          disabled={Boolean(paymentSession?.paymentUrl)}
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
