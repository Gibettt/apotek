import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AccurateInvoiceInput } from "./accurateClient";
import {
  PaymentConfigurationError,
  PaymentValidationError
} from "./paymentErrors";
import type { PaymentLineItem, XenditPaymentSession } from "./xenditClient";

export interface PricedPaymentItem extends PaymentLineItem {
  obatId: number;
}

export type StoredPaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export interface PaymentRecord {
  id: number;
  reference: string;
  number: string;
  total: number;
  status: StoredPaymentStatus;
  providerId?: string;
  paymentUrl?: string;
  expiresAt?: string;
  accurateSyncStatus?: string;
}

export interface PaymentRepository {
  findByReference(reference: string): Promise<PaymentRecord | null>;
  prepareItems(
    items: Array<{ obatId: number; quantity: number }>
  ): Promise<PricedPaymentItem[]>;
  createPendingSale(input: {
    reference: string;
    items: PricedPaymentItem[];
    total: number;
  }): Promise<PaymentRecord>;
  attachProviderPayment(
    saleId: number,
    payment: XenditPaymentSession
  ): Promise<PaymentRecord>;
  markPaymentFailed(saleId: number): Promise<void>;
  markPaymentExpired(reference: string): Promise<void>;
  finalizePayment(reference: string, providerPaymentId: string): Promise<number>;
  loadAccurateInvoice(saleId: number): Promise<AccurateInvoiceInput>;
  markAccurateSync(
    saleId: number,
    status: string,
    invoiceId?: number,
    errorMessage?: string
  ): Promise<void>;
}

interface ObatRow {
  id: number;
  kode_obat: string;
  nama_obat: string;
  harga_jual: number | string | null;
  status: boolean | null;
}

interface PaymentRow {
  id: number;
  nomor_penjualan: string;
  total: number | string | null;
  payment_external_id: string;
  payment_provider_id: string | null;
  payment_url: string | null;
  payment_status: StoredPaymentStatus | null;
  payment_expires_at: string | null;
  accurate_sync_status: string | null;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new PaymentConfigurationError(
      "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada server"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function toPaymentRecord(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    reference: row.payment_external_id,
    number: row.nomor_penjualan,
    total: Number(row.total ?? 0),
    status: row.payment_status ?? "PENDING",
    providerId: row.payment_provider_id ?? undefined,
    paymentUrl: row.payment_url ?? undefined,
    expiresAt: row.payment_expires_at ?? undefined,
    accurateSyncStatus: row.accurate_sync_status ?? undefined
  };
}

function saleNumber(reference: string) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = reference.replace(/-/g, "").slice(-10).toUpperCase();
  return `PJL-${date}-${suffix}`;
}

export function createPaymentRepository(
  client: SupabaseClient = getAdminClient()
): PaymentRepository {
  return {
    async findByReference(reference) {
      const { data, error } = await client
        .from("penjualan")
        .select(
          "id,nomor_penjualan,total,payment_external_id,payment_provider_id,payment_url,payment_status,payment_expires_at,accurate_sync_status"
        )
        .eq("payment_external_id", reference)
        .maybeSingle();
      if (error) {
        throw new Error("Data pembayaran tidak dapat dimuat");
      }
      return data ? toPaymentRecord(data as PaymentRow) : null;
    },

    async prepareItems(items) {
      const ids = items.map((item) => item.obatId);
      const [obatResult, stokResult] = await Promise.all([
        client
          .from("obat")
          .select("id,kode_obat,nama_obat,harga_jual,status")
          .in("id", ids),
        client.from("stok").select("obat_id,jumlah").in("obat_id", ids)
      ]);
      if (obatResult.error || stokResult.error) {
        throw new Error("Data harga dan stok obat tidak dapat diverifikasi");
      }

      const obatById = new Map(
        ((obatResult.data ?? []) as ObatRow[]).map((item) => [item.id, item])
      );
      const stockById = (stokResult.data ?? []).reduce<Record<number, number>>(
        (stock, row) => {
          if (row.obat_id) {
            stock[row.obat_id] =
              (stock[row.obat_id] ?? 0) + Number(row.jumlah ?? 0);
          }
          return stock;
        },
        {}
      );

      return items.map((requested) => {
        const obat = obatById.get(requested.obatId);
        if (!obat || !obat.status) {
          throw new PaymentValidationError(
            "Salah satu obat tidak tersedia untuk dijual"
          );
        }
        if ((stockById[obat.id] ?? 0) < requested.quantity) {
          throw new PaymentValidationError(`Stok ${obat.nama_obat} tidak cukup`);
        }

        const unitPrice = Number(obat.harga_jual ?? 0);
        if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
          throw new PaymentValidationError(
            `Harga ${obat.nama_obat} tidak valid untuk pembayaran digital`
          );
        }
        return {
          obatId: obat.id,
          code: obat.kode_obat,
          name: obat.nama_obat,
          quantity: requested.quantity,
          unitPrice
        };
      });
    },

    async createPendingSale(input) {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from("penjualan")
        .insert({
          nomor_penjualan: saleNumber(input.reference),
          tanggal_penjualan: now,
          subtotal: input.total,
          diskon: 0,
          pajak: 0,
          total: input.total,
          metode_pembayaran: "accurate",
          bayar: 0,
          kembalian: 0,
          status: "menunggu_pembayaran",
          payment_provider: "xendit",
          payment_external_id: input.reference,
          payment_status: "PENDING",
          accurate_sync_status: "PENDING",
          created_at: now
        })
        .select(
          "id,nomor_penjualan,total,payment_external_id,payment_provider_id,payment_url,payment_status,payment_expires_at,accurate_sync_status"
        )
        .single();

      if (error) {
        if (error.code === "23505") {
          const existing = await this.findByReference(input.reference);
          if (existing) {
            return existing;
          }
        }
        throw new Error("Transaksi pembayaran tidak dapat dibuat");
      }

      const { error: detailError } = await client.from("penjualan_detail").insert(
        input.items.map((item) => ({
          penjualan_id: data.id,
          obat_id: item.obatId,
          jumlah: item.quantity,
          harga_jual: item.unitPrice,
          diskon: 0,
          subtotal: item.unitPrice * item.quantity
        }))
      );
      if (detailError) {
        await this.markPaymentFailed(data.id);
        throw new Error("Detail transaksi pembayaran tidak dapat dibuat");
      }

      return toPaymentRecord(data as PaymentRow);
    },

    async attachProviderPayment(saleId, payment) {
      const { data, error } = await client
        .from("penjualan")
        .update({
          payment_provider_id: payment.providerId,
          payment_url: payment.paymentUrl,
          payment_status: payment.status,
          payment_expires_at: payment.expiresAt
        })
        .eq("id", saleId)
        .select(
          "id,nomor_penjualan,total,payment_external_id,payment_provider_id,payment_url,payment_status,payment_expires_at,accurate_sync_status"
        )
        .single();
      if (error) {
        throw new Error("Link pembayaran tidak dapat disimpan");
      }
      return toPaymentRecord(data as PaymentRow);
    },

    async markPaymentFailed(saleId) {
      const { error } = await client
        .from("penjualan")
        .update({ payment_status: "FAILED", status: "gagal" })
        .eq("id", saleId);
      if (error) {
        throw new Error("Status pembayaran gagal tidak dapat disimpan");
      }
    },

    async markPaymentExpired(reference) {
      const { error } = await client
        .from("penjualan")
        .update({ payment_status: "EXPIRED", status: "gagal" })
        .eq("payment_external_id", reference)
        .neq("payment_status", "PAID");
      if (error) {
        throw new Error("Status kedaluwarsa tidak dapat disimpan");
      }
    },

    async finalizePayment(reference, providerPaymentId) {
      const { data, error } = await client.rpc("finalize_accurate_payment", {
        p_external_id: reference,
        p_provider_payment_id: providerPaymentId
      });
      if (error || !data) {
        throw new Error("Pembayaran diterima, tetapi transaksi belum dapat diselesaikan");
      }
      return Number(data);
    },

    async loadAccurateInvoice(saleId) {
      const customerNo = process.env.ACCURATE_CUSTOMER_NO;
      if (!customerNo) {
        throw new PaymentConfigurationError(
          "ACCURATE_CUSTOMER_NO belum dikonfigurasi pada server"
        );
      }

      const [saleResult, detailResult] = await Promise.all([
        client
          .from("penjualan")
          .select("nomor_penjualan,tanggal_penjualan")
          .eq("id", saleId)
          .single(),
        client
          .from("penjualan_detail")
          .select("obat_id,jumlah,harga_jual")
          .eq("penjualan_id", saleId)
      ]);
      if (saleResult.error || detailResult.error) {
        throw new Error("Transaksi belum dapat disiapkan untuk Accurate");
      }

      const ids = (detailResult.data ?? []).map((item) => item.obat_id);
      const { data: obatData, error: obatError } = await client
        .from("obat")
        .select("id,kode_obat,nama_obat")
        .in("id", ids);
      if (obatError) {
        throw new Error("Kode obat Accurate tidak dapat dimuat");
      }
      const obatById = new Map(
        (obatData ?? []).map((item) => [item.id, item])
      );

      return {
        number: saleResult.data.nomor_penjualan,
        date: new Date(saleResult.data.tanggal_penjualan),
        customerNo,
        items: (detailResult.data ?? []).map((detail) => {
          const obat = obatById.get(detail.obat_id);
          if (!obat) {
            throw new Error("Kode obat tidak ditemukan untuk sinkronisasi Accurate");
          }
          return {
            code: obat.kode_obat,
            name: obat.nama_obat,
            quantity: Number(detail.jumlah),
            unitPrice: Number(detail.harga_jual)
          };
        })
      };
    },

    async markAccurateSync(saleId, status, invoiceId, errorMessage) {
      const { error } = await client
        .from("penjualan")
        .update({
          accurate_sync_status: status,
          accurate_invoice_id: invoiceId ?? null,
          accurate_sync_error: errorMessage?.slice(0, 500) ?? null
        })
        .eq("id", saleId);
      if (error) {
        throw new Error("Status sinkronisasi Accurate tidak dapat disimpan");
      }
    }
  };
}
