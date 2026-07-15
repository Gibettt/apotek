export type AccuratePaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export interface AccuratePaymentSession {
  reference: string;
  status: AccuratePaymentStatus;
  paymentUrl?: string;
  expiresAt?: string;
  saleId?: string;
  accurateSyncStatus?: string;
}

async function readResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    data?: AccuratePaymentSession;
    message?: string;
  } | null;
  if (!response.ok || !body?.data) {
    throw new Error(body?.message ?? "Pembayaran Accurate tidak dapat diproses");
  }
  return body.data;
}

export const accuratePaymentService = {
  async create(payload: {
    idempotencyKey: string;
    items: Array<{ barangId: string; quantity: number }>;
  }) {
    const response = await fetch("/api/payments/accurate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return readResponse(response);
  },

  async getStatus(reference: string) {
    const response = await fetch(
      `/api/payments/accurate/${encodeURIComponent(reference)}`,
      { cache: "no-store" }
    );
    return readResponse(response);
  }
};
