import { z } from "zod";
import {
  PaymentConfigurationError,
  PaymentProviderError
} from "./paymentErrors";
import type { PaymentLineItem } from "./xenditClient";

export interface AccurateInvoiceInput {
  number: string;
  date: Date;
  customerNo: string;
  items: PaymentLineItem[];
}

interface AccurateClientOptions {
  accessToken?: string;
  host?: string;
  sessionId?: string;
  warehouseName?: string;
  fetcher?: typeof fetch;
}

const accurateResponseSchema = z.object({
  s: z.literal(true),
  r: z.object({
    id: z.number().int().positive(),
    number: z.string().optional()
  })
});

function formatAccurateDate(date: Date) {
  return [
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    date.getUTCFullYear()
  ].join("/");
}

export function buildAccurateInvoicePayload(
  input: AccurateInvoiceInput,
  warehouseName?: string
) {
  return {
    customerNo: input.customerNo,
    number: input.number,
    transDate: formatAccurateDate(input.date),
    description: `Pembayaran POS ${input.number} via Xendit`,
    detailDownPayment: [],
    detailExpense: [],
    detailItem: input.items.map((item) => ({
      itemNo: item.code,
      detailName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      ...(warehouseName ? { warehouseName } : {})
    }))
  };
}

function assertAccurateHost(host: string) {
  const url = new URL(host);
  if (
    url.protocol !== "https:" ||
    (url.hostname !== "accurate.id" && !url.hostname.endsWith(".accurate.id"))
  ) {
    throw new PaymentConfigurationError("ACCURATE_HOST tidak valid");
  }
  return url.origin;
}

async function fetchWithAccurateRedirect(
  url: string,
  init: RequestInit,
  fetcher: typeof fetch,
  redirectCount = 0
): Promise<Response> {
  const response = await fetcher(url, { ...init, redirect: "manual" });
  if (response.status !== 308) {
    return response;
  }
  if (redirectCount >= 3) {
    throw new PaymentProviderError("Terlalu banyak pengalihan dari Accurate");
  }

  let nextUrl = response.headers.get("location");
  if (!nextUrl) {
    const body = (await response.json().catch(() => null)) as {
      endpoint?: string;
    } | null;
    nextUrl = body?.endpoint ?? null;
  }
  if (!nextUrl) {
    throw new PaymentProviderError("Alamat API Accurate telah berubah");
  }

  const safeUrl = new URL(nextUrl, url);
  assertAccurateHost(safeUrl.origin);
  return fetchWithAccurateRedirect(
    safeUrl.toString(),
    init,
    fetcher,
    redirectCount + 1
  );
}

export async function createAccurateSalesInvoice(
  input: AccurateInvoiceInput,
  options: AccurateClientOptions = {}
) {
  const accessToken = options.accessToken ?? process.env.ACCURATE_API_TOKEN;
  const sessionId = options.sessionId ?? process.env.ACCURATE_SESSION_ID;
  const host = options.host ?? process.env.ACCURATE_HOST;
  if (!accessToken || !sessionId || !host) {
    throw new PaymentConfigurationError(
      "Kredensial API Accurate belum lengkap pada server"
    );
  }

  const baseUrl = assertAccurateHost(host);
  const fetcher = options.fetcher ?? fetch;
  const response = await fetchWithAccurateRedirect(
    `${baseUrl}/accurate/api/sales-invoice/save.do`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Session-ID": sessionId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        buildAccurateInvoicePayload(input, options.warehouseName)
      ),
      signal: AbortSignal.timeout(15000)
    },
    fetcher
  );
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new PaymentProviderError("Faktur belum dapat dikirim ke Accurate");
  }

  const result = accurateResponseSchema.safeParse(body);
  if (!result.success) {
    throw new PaymentProviderError("Respons Faktur Penjualan Accurate tidak valid");
  }

  return {
    id: result.data.r.id,
    number: result.data.r.number ?? input.number
  };
}
