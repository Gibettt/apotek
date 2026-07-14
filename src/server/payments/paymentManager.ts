import type { AccurateInvoiceInput } from "./accurateClient";
import {
  PaymentConfigurationError,
  PaymentNotFoundError,
  PaymentProviderError
} from "./paymentErrors";
import type {
  PaymentRecord,
  PaymentRepository
} from "./paymentRepository";
import type {
  CreateAccuratePaymentInput,
  XenditWebhookInput
} from "./paymentSchemas";
import type { XenditPaymentSession } from "./xenditClient";

export interface PaymentManagerDependencies {
  repository: PaymentRepository;
  createProviderLink(input: {
    reference: string;
    amount: number;
    items: Awaited<ReturnType<PaymentRepository["prepareItems"]>>;
  }): Promise<XenditPaymentSession>;
  getProviderLink(providerId: string): Promise<XenditPaymentSession>;
  syncAccurateInvoice(
    input: AccurateInvoiceInput
  ): Promise<{ id: number; number: string }>;
}

function toPublicPayment(record: PaymentRecord) {
  return {
    reference: record.reference,
    status: record.status,
    paymentUrl: record.paymentUrl,
    expiresAt: record.expiresAt,
    saleId: record.status === "PAID" ? record.id : undefined,
    accurateSyncStatus: record.accurateSyncStatus
  };
}

async function syncSaleToAccurate(
  saleId: number,
  dependencies: PaymentManagerDependencies
) {
  try {
    const invoice = await dependencies.repository.loadAccurateInvoice(saleId);
    const accurate = await dependencies.syncAccurateInvoice(invoice);
    await dependencies.repository.markAccurateSync(
      saleId,
      "SYNCED",
      accurate.id
    );
  } catch (error) {
    const status =
      error instanceof PaymentConfigurationError
        ? "PENDING_CONFIGURATION"
        : "FAILED";
    await dependencies.repository.markAccurateSync(
      saleId,
      status,
      undefined,
      error instanceof Error ? error.message : "Sinkronisasi Accurate gagal"
    );
  }
}

export async function createAccuratePayment(
  input: CreateAccuratePaymentInput,
  dependencies: PaymentManagerDependencies
) {
  const reference = `APOTEK-${input.idempotencyKey}`;
  const existing = await dependencies.repository.findByReference(reference);
  if (existing) {
    return toPublicPayment(existing);
  }

  const items = await dependencies.repository.prepareItems(input.items);
  const amount = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
  const pending = await dependencies.repository.createPendingSale({
    reference,
    items,
    total: amount
  });
  if (pending.providerId || pending.paymentUrl) {
    return toPublicPayment(pending);
  }

  let providerPayment: XenditPaymentSession;
  try {
    providerPayment = await dependencies.createProviderLink({
      reference,
      amount,
      items
    });
    if (
      providerPayment.reference !== reference ||
      providerPayment.amount !== amount
    ) {
      throw new PaymentProviderError("Respons pembayaran tidak sesuai transaksi");
    }
  } catch (error) {
    await dependencies.repository.markPaymentFailed(pending.id);
    throw error;
  }

  const stored = await dependencies.repository.attachProviderPayment(
    pending.id,
    providerPayment
  );
  return toPublicPayment(stored);
}

export async function handleXenditWebhook(
  input: XenditWebhookInput,
  dependencies: PaymentManagerDependencies
) {
  const record = await dependencies.repository.findByReference(
    input.external_id
  );
  if (!record) {
    throw new PaymentNotFoundError("Referensi pembayaran tidak ditemukan");
  }
  if (record.providerId && record.providerId !== input.id) {
    throw new Error("Identitas callback pembayaran tidak sesuai");
  }
  if (record.total !== input.amount) {
    throw new Error("Nominal callback pembayaran tidak sesuai");
  }

  if (input.status === "EXPIRED") {
    await dependencies.repository.markPaymentExpired(input.external_id);
    return { ...toPublicPayment(record), status: "EXPIRED" as const };
  }
  if (input.status !== "PAID") {
    return toPublicPayment(record);
  }
  if ((input.paid_amount ?? input.amount) !== record.total) {
    throw new Error("Nominal pembayaran diterima tidak sesuai");
  }

  const saleId = await dependencies.repository.finalizePayment(
    input.external_id,
    input.payment_id ?? input.id
  );
  if (record.accurateSyncStatus !== "SYNCED") {
    await syncSaleToAccurate(saleId, dependencies);
  }

  return {
    ...toPublicPayment(record),
    status: "PAID" as const,
    saleId
  };
}

export async function refreshAccuratePayment(
  reference: string,
  dependencies: PaymentManagerDependencies
) {
  const record = await dependencies.repository.findByReference(reference);
  if (!record) {
    throw new PaymentNotFoundError("Pembayaran tidak ditemukan");
  }
  if (record.status === "PAID") {
    if (record.accurateSyncStatus !== "SYNCED") {
      await syncSaleToAccurate(record.id, dependencies);
    }
    return toPublicPayment(record);
  }
  if (record.status !== "PENDING" || !record.providerId) {
    return toPublicPayment(record);
  }

  const provider = await dependencies.getProviderLink(record.providerId);
  return handleXenditWebhook(
    {
      id: provider.providerId,
      external_id: provider.reference,
      status: provider.status,
      amount: provider.amount,
      paid_amount: provider.status === "PAID" ? provider.amount : undefined
    },
    dependencies
  );
}
