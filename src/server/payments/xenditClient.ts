import { z } from "zod";
import {
  PaymentConfigurationError,
  PaymentProviderError
} from "./paymentErrors";

const XENDIT_API_URL = "https://api.xendit.co";

const xenditPaymentSessionSchema = z.object({
  payment_session_id: z.string().min(1),
  reference_id: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "EXPIRED", "CANCELED"]),
  payment_link_url: z.string().url(),
  expires_at: z.string().min(1),
  amount: z.number().positive()
});

export interface PaymentLineItem {
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface XenditPaymentSession {
  providerId: string;
  reference: string;
  status: "PENDING" | "PAID" | "EXPIRED";
  paymentUrl: string;
  expiresAt: string;
  amount: number;
}

interface XenditClientOptions {
  apiKey?: string;
  fetcher?: typeof fetch;
}

function getClient(options: XenditClientOptions) {
  const apiKey = options.apiKey ?? process.env.XENDIT_SECRET_KEY;
  if (!apiKey) {
    throw new PaymentConfigurationError(
      "XENDIT_SECRET_KEY belum dikonfigurasi pada server"
    );
  }

  return {
    fetcher: options.fetcher ?? fetch,
    authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`
  };
}

function normalizeSessionStatus(
  status: z.infer<typeof xenditPaymentSessionSchema>["status"]
): XenditPaymentSession["status"] {
  if (status === "COMPLETED") return "PAID";
  if (status === "EXPIRED" || status === "CANCELED") return "EXPIRED";
  return "PENDING";
}

async function parseResponse(
  response: Response
): Promise<XenditPaymentSession> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new PaymentProviderError();
  }

  const result = xenditPaymentSessionSchema.safeParse(body);
  if (!result.success) {
    throw new PaymentProviderError("Respons pembayaran Xendit tidak valid");
  }

  return {
    providerId: result.data.payment_session_id,
    reference: result.data.reference_id,
    status: normalizeSessionStatus(result.data.status),
    paymentUrl: result.data.payment_link_url,
    expiresAt: result.data.expires_at,
    amount: result.data.amount
  };
}

export async function createXenditPaymentSession(
  input: {
    reference: string;
    amount: number;
    items: PaymentLineItem[];
  },
  options: XenditClientOptions = {}
) {
  const itemTotal = input.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
  if (itemTotal !== input.amount || input.amount <= 0) {
    throw new PaymentProviderError("Total pembayaran tidak valid");
  }

  const { fetcher, authorization } = getClient(options);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const response = await fetcher(`${XENDIT_API_URL}/sessions`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reference_id: input.reference,
      session_type: "PAY",
      mode: "PAYMENT_LINK",
      amount: input.amount,
      currency: "IDR",
      country: "ID",
      capture_method: "AUTOMATIC",
      expires_at: expiresAt,
      locale: "id",
      description: `Pembayaran POS ${input.reference}`,
      customer: {
        type: "INDIVIDUAL",
        reference_id: input.reference.replace(/[^a-zA-Z0-9]/g, ""),
        individual_detail: { given_names: "Pelanggan Umum" }
      },
      items: input.items.map((item) => ({
        reference_id: item.code,
        type: "PHYSICAL_PRODUCT",
        name: item.name,
        net_unit_amount: item.unitPrice,
        quantity: item.quantity,
        category: "Obat"
      })),
      metadata: { sale_reference: input.reference }
    }),
    signal: AbortSignal.timeout(15000)
  });

  return parseResponse(response);
}

export async function getXenditPaymentSession(
  providerId: string,
  options: XenditClientOptions = {}
) {
  const { fetcher, authorization } = getClient(options);
  const response = await fetcher(
    `${XENDIT_API_URL}/sessions/${encodeURIComponent(providerId)}`,
    {
      headers: { Authorization: authorization },
      signal: AbortSignal.timeout(15000)
    }
  );

  return parseResponse(response);
}
