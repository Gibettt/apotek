import { describe, expect, it, vi } from "vitest";
import {
  createXenditPaymentSession,
  getXenditPaymentSession
} from "./xenditClient";

describe("Xendit payment client", () => {
  it("creates a short-lived IDR payment link with server-calculated items", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          payment_session_id: "ps-661f87c614802d6c402cd82d",
          reference_id: "APOTEK-123",
          status: "ACTIVE",
          payment_link_url:
            "https://checkout.xendit.test/sessions/ps-661f87c614802d6c402cd82d",
          expires_at: "2026-07-13T10:30:00.000Z",
          amount: 30000
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await createXenditPaymentSession(
      {
        reference: "APOTEK-123",
        amount: 30000,
        items: [
          {
            code: "OBT-PAY",
            name: "Obat Bayar",
            quantity: 1,
            unitPrice: 30000
          }
        ]
      },
      { apiKey: "xnd_development_test", fetcher }
    );

    expect(result.paymentUrl).toBe(
      "https://checkout.xendit.test/sessions/ps-661f87c614802d6c402cd82d"
    );
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.xendit.co/sessions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from(
            "xnd_development_test:"
          ).toString("base64")}`
        })
      })
    );

    const body = JSON.parse(
      String((fetcher.mock.calls[0][1] as RequestInit).body)
    );
    expect(body).toEqual(
      expect.objectContaining({
        reference_id: "APOTEK-123",
        session_type: "PAY",
        mode: "PAYMENT_LINK",
        amount: 30000,
        currency: "IDR",
        country: "ID",
        capture_method: "AUTOMATIC",
        customer: {
          type: "INDIVIDUAL",
          reference_id: "APOTEK123",
          individual_detail: { given_names: "Pelanggan Umum" }
        }
      })
    );
    expect(body.items).toEqual([
      {
        reference_id: "OBT-PAY",
        type: "PHYSICAL_PRODUCT",
        name: "Obat Bayar",
        net_unit_amount: 30000,
        quantity: 1,
        category: "Obat"
      }
    ]);
    expect(new Date(body.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it("reads the provider status without exposing the API key", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          payment_session_id: "ps-661f87c614802d6c402cd82d",
          reference_id: "APOTEK-123",
          status: "COMPLETED",
          payment_link_url:
            "https://checkout.xendit.test/sessions/ps-661f87c614802d6c402cd82d",
          expires_at: "2026-07-13T10:30:00.000Z",
          amount: 30000
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await getXenditPaymentSession(
      "ps-661f87c614802d6c402cd82d",
      {
      apiKey: "xnd_development_test",
      fetcher
      }
    );

    expect(result.status).toBe("PAID");
    expect(JSON.stringify(result)).not.toContain("xnd_development_test");
  });

  it("treats a canceled session as expired", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          payment_session_id: "ps-661f87c614802d6c402cd82d",
          reference_id: "APOTEK-123",
          status: "CANCELED",
          payment_link_url:
            "https://checkout.xendit.test/sessions/ps-661f87c614802d6c402cd82d",
          expires_at: "2026-07-13T10:30:00.000Z",
          amount: 30000
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await getXenditPaymentSession(
      "ps-661f87c614802d6c402cd82d",
      { apiKey: "xnd_development_test", fetcher }
    );

    expect(result.status).toBe("EXPIRED");
  });

  it("rejects totals that do not match the line items", async () => {
    await expect(
      createXenditPaymentSession(
        {
          reference: "APOTEK-123",
          amount: 1,
          items: [
            {
              code: "OBT-PAY",
              name: "Obat Bayar",
              quantity: 1,
              unitPrice: 30000
            }
          ]
        },
        { apiKey: "xnd_development_test", fetcher: vi.fn() }
      )
    ).rejects.toThrow("Total pembayaran tidak valid");
  });

  it("requires a server API key and hides provider error details", async () => {
    const previousKey = process.env.XENDIT_SECRET_KEY;
    delete process.env.XENDIT_SECRET_KEY;
    await expect(
      getXenditPaymentSession("ps-661f87c614802d6c402cd82d", {
        fetcher: vi.fn()
      })
    ).rejects.toThrow("XENDIT_SECRET_KEY belum dikonfigurasi");
    process.env.XENDIT_SECRET_KEY = previousKey;

    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "internal provider detail" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    );
    await expect(
      getXenditPaymentSession("ps-661f87c614802d6c402cd82d", {
        apiKey: "xnd_development_test",
        fetcher
      })
    ).rejects.toThrow("Penyedia pembayaran tidak dapat memproses transaksi");
  });
});
