import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AccurateInvoiceInput } from "./accurateClient";
import {
  PaymentConfigurationError,
  PaymentValidationError
} from "./paymentErrors";
import type { PaymentLineItem, XenditPaymentSession } from "./xenditClient";

export interface PricedPaymentItem extends PaymentLineItem {
  barangId: string;
}

export type StoredPaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export interface PaymentRecord {
  id: string;
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
    items: Array<{ barangId: string; quantity: number }>
  ): Promise<PricedPaymentItem[]>;
  createPendingSale(input: {
    reference: string;
    items: PricedPaymentItem[];
    total: number;
  }): Promise<PaymentRecord>;
  attachProviderPayment(
    saleId: string,
    payment: XenditPaymentSession
  ): Promise<PaymentRecord>;
  markPaymentFailed(saleId: string): Promise<void>;
  markPaymentExpired(reference: string): Promise<void>;
  finalizePayment(reference: string, providerPaymentId: string): Promise<string>;
  loadAccurateInvoice(saleId: string): Promise<AccurateInvoiceInput>;
  markAccurateSync(
    saleId: string,
    status: string,
    invoiceId?: number,
    errorMessage?: string
  ): Promise<void>;
}

interface BarangRow {
  id: string;
  kode: string;
  nama: string;
  status: boolean | null;
}

interface ActivePriceRow {
  barang_id: string;
  harga_jual: number | string | null;
}

interface SaldoStokRow {
  barang_id: string | null;
  qty: number | string | null;
}

interface PaymentRow {
  id: string;
  cabang_id: string;
  nomor_invoice: string;
  grand_total: number | string | null;
  payment_external_id: string;
  payment_provider_id: string | null;
  payment_url: string | null;
  payment_status: StoredPaymentStatus | null;
  payment_expires_at: string | null;
  accurate_sync_status: string | null;
}

const PAYMENT_ROW_COLUMNS =
  "id,cabang_id,nomor_invoice,grand_total,payment_external_id,payment_provider_id,payment_url,payment_status,payment_expires_at,accurate_sync_status";

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
    number: row.nomor_invoice,
    total: Number(row.grand_total ?? 0),
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

async function resolveDefaultCabangId(client: SupabaseClient) {
  const { data, error } = await client
    .from("cabang")
    .select("id")
    .eq("aktif", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new PaymentConfigurationError("Tidak ada cabang aktif untuk transaksi pembayaran");
  }

  return data.id as string;
}

export function createPaymentRepository(
  client: SupabaseClient = getAdminClient()
): PaymentRepository {
  return {
    async findByReference(reference) {
      const { data, error } = await client
        .from("penjualan")
        .select(PAYMENT_ROW_COLUMNS)
        .eq("payment_external_id", reference)
        .maybeSingle();
      if (error) {
        throw new Error("Data pembayaran tidak dapat dimuat");
      }
      return data ? toPaymentRecord(data as PaymentRow) : null;
    },

    async prepareItems(items) {
      const ids = items.map((item) => item.barangId);
      const [barangResult, priceResult, stokResult] = await Promise.all([
        client.from("barang").select("id,kode,nama,status").in("id", ids),
        client
          .from("v_harga_barang_aktif")
          .select("barang_id,harga_jual")
          .in("barang_id", ids)
          .eq("tipe_harga", "jual"),
        client.from("saldo_stok").select("barang_id,qty").in("barang_id", ids)
      ]);
      if (barangResult.error || priceResult.error || stokResult.error) {
        throw new Error("Data harga dan stok obat tidak dapat diverifikasi");
      }

      const barangById = new Map(
        ((barangResult.data ?? []) as BarangRow[]).map((item) => [item.id, item])
      );
      const priceByBarang = new Map(
        ((priceResult.data ?? []) as ActivePriceRow[]).map((row) => [
          row.barang_id,
          Number(row.harga_jual ?? 0)
        ])
      );
      const stockById = ((stokResult.data ?? []) as SaldoStokRow[]).reduce<
        Record<string, number>
      >((stock, row) => {
        if (row.barang_id) {
          stock[row.barang_id] = (stock[row.barang_id] ?? 0) + Number(row.qty ?? 0);
        }
        return stock;
      }, {});

      return items.map((requested) => {
        const barang = barangById.get(requested.barangId);
        if (!barang || !barang.status) {
          throw new PaymentValidationError(
            "Salah satu obat tidak tersedia untuk dijual"
          );
        }
        if ((stockById[barang.id] ?? 0) < requested.quantity) {
          throw new PaymentValidationError(`Stok ${barang.nama} tidak cukup`);
        }

        const unitPrice = priceByBarang.get(barang.id) ?? 0;
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw new PaymentValidationError(
            `Harga ${barang.nama} tidak valid untuk pembayaran digital`
          );
        }
        return {
          barangId: barang.id,
          code: barang.kode,
          name: barang.nama,
          quantity: requested.quantity,
          unitPrice
        };
      });
    },

    async createPendingSale(input) {
      const now = new Date().toISOString();
      const cabangId = await resolveDefaultCabangId(client);
      const { data, error } = await client
        .from("penjualan")
        .insert({
          cabang_id: cabangId,
          nomor_invoice: saleNumber(input.reference),
          tanggal: now,
          tipe_penjualan: "umum",
          subtotal: input.total,
          diskon_total: 0,
          pajak_total: 0,
          grand_total: input.total,
          bayar_total: 0,
          kembalian: 0,
          status_bayar: "belum_bayar",
          status: "menunggu_pembayaran",
          payment_provider: "xendit",
          payment_external_id: input.reference,
          payment_status: "PENDING",
          accurate_sync_status: "PENDING",
          updated_at: now
        })
        .select(PAYMENT_ROW_COLUMNS)
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
          barang_id: item.barangId,
          qty: item.quantity,
          harga_jual: item.unitPrice,
          diskon_persen: 0,
          diskon_nominal: 0,
          subtotal: item.unitPrice * item.quantity,
          harga_pokok: 0
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
        .select(PAYMENT_ROW_COLUMNS)
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
      return String(data);
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
          .select("nomor_invoice,tanggal")
          .eq("id", saleId)
          .single(),
        client
          .from("penjualan_detail")
          .select("barang_id,qty,harga_jual")
          .eq("penjualan_id", saleId)
      ]);
      if (saleResult.error || detailResult.error) {
        throw new Error("Transaksi belum dapat disiapkan untuk Accurate");
      }

      const ids = (detailResult.data ?? []).map((item) => item.barang_id);
      const { data: barangData, error: barangError } = await client
        .from("barang")
        .select("id,kode,nama")
        .in("id", ids);
      if (barangError) {
        throw new Error("Kode obat Accurate tidak dapat dimuat");
      }
      const barangById = new Map((barangData ?? []).map((item) => [item.id, item]));

      return {
        number: saleResult.data.nomor_invoice,
        date: new Date(saleResult.data.tanggal),
        customerNo,
        items: (detailResult.data ?? []).map((detail) => {
          const barang = barangById.get(detail.barang_id);
          if (!barang) {
            throw new Error("Kode obat tidak ditemukan untuk sinkronisasi Accurate");
          }
          return {
            code: barang.kode,
            name: barang.nama,
            quantity: Number(detail.qty),
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
