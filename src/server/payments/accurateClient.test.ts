import { describe, expect, it, vi } from "vitest";
import {
  buildAccurateInvoicePayload,
  createAccurateSalesInvoice
} from "./accurateClient";

const invoice = {
  number: "PJL-20260713-00001",
  date: new Date("2026-07-13T03:00:00.000Z"),
  customerNo: "UMUM",
  items: [
    {
      code: "OBT-PAY",
      name: "Obat Bayar",
      quantity: 2,
      unitPrice: 15000
    }
  ]
};

describe("Accurate sales invoice client", () => {
  it("builds the documented Accurate sales invoice payload", () => {
    expect(buildAccurateInvoicePayload(invoice)).toEqual({
      customerNo: "UMUM",
      number: "PJL-20260713-00001",
      transDate: "13/07/2026",
      description: "Pembayaran POS PJL-20260713-00001 via Xendit",
      detailDownPayment: [],
      detailExpense: [],
      detailItem: [
        {
          itemNo: "OBT-PAY",
          detailName: "Obat Bayar",
          quantity: 2,
          unitPrice: 15000
        }
      ]
    });
  });

  it("keeps Accurate credentials on the server request", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ s: true, r: { id: 991, number: invoice.number } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await createAccurateSalesInvoice(invoice, {
      accessToken: "accurate-secret-token",
      host: "https://public.accurate.id",
      sessionId: "session-123",
      fetcher
    });

    expect(result).toEqual({ id: 991, number: invoice.number });
    expect(fetcher).toHaveBeenCalledWith(
      "https://public.accurate.id/accurate/api/sales-invoice/save.do",
      expect.objectContaining({
        method: "POST",
        redirect: "manual",
        headers: expect.objectContaining({
          Authorization: "Bearer accurate-secret-token",
          "X-Session-ID": "session-123"
        })
      })
    );
  });

  it("requires complete credentials and an official HTTPS Accurate host", async () => {
    await expect(
      createAccurateSalesInvoice(invoice, {
        accessToken: "token",
        fetcher: vi.fn()
      })
    ).rejects.toThrow("Kredensial API Accurate belum lengkap");

    await expect(
      createAccurateSalesInvoice(invoice, {
        accessToken: "token",
        sessionId: "session",
        host: "https://evil.test",
        fetcher: vi.fn()
      })
    ).rejects.toThrow("ACCURATE_HOST tidak valid");
  });

  it("follows an official 308 host redirect while preserving authorization", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 308,
          headers: {
            Location:
              "https://zeus.accurate.id/accurate/api/sales-invoice/save.do"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ s: true, r: { id: 991 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );

    const result = await createAccurateSalesInvoice(invoice, {
      accessToken: "accurate-secret-token",
      host: "https://public.accurate.id",
      sessionId: "session-123",
      fetcher
    });

    expect(result.number).toBe(invoice.number);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer accurate-secret-token"
        })
      })
    );
  });

  it("returns a generic error for a rejected Accurate invoice", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ s: false, d: ["sensitive detail"] }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    );

    await expect(
      createAccurateSalesInvoice(invoice, {
        accessToken: "token",
        host: "https://public.accurate.id",
        sessionId: "session",
        fetcher
      })
    ).rejects.toThrow("Faktur belum dapat dikirim ke Accurate");
  });
});
