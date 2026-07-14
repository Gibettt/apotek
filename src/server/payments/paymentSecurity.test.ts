import { afterEach, describe, expect, it } from "vitest";
import {
  assertPaymentGatewayEnabled,
  assertPaymentRateLimit,
  assertSameOrigin,
  verifyXenditCallbackToken
} from "./paymentSecurity";

const originalEnabled = process.env.PAYMENT_GATEWAY_ENABLED;
const originalAppUrl = process.env.APP_URL;

afterEach(() => {
  if (originalEnabled === undefined) {
    delete process.env.PAYMENT_GATEWAY_ENABLED;
  } else {
    process.env.PAYMENT_GATEWAY_ENABLED = originalEnabled;
  }
  if (originalAppUrl === undefined) {
    delete process.env.APP_URL;
  } else {
    process.env.APP_URL = originalAppUrl;
  }
});

describe("payment request security", () => {
  it("accepts only the configured Xendit callback token", () => {
    expect(verifyXenditCallbackToken("callback-secret", "callback-secret")).toBe(
      true
    );
    expect(verifyXenditCallbackToken("callback-secret", "wrong-secret")).toBe(
      false
    );
    expect(verifyXenditCallbackToken(null, "callback-secret")).toBe(false);
  });

  it("accepts same-origin checkout requests and rejects cross-origin requests", () => {
    const sameOrigin = new Request("https://apotek.test/api/payments/accurate", {
      method: "POST",
      headers: { Origin: "https://apotek.test" }
    });
    const crossOrigin = new Request(
      "https://apotek.test/api/payments/accurate",
      {
        method: "POST",
        headers: { Origin: "https://evil.test" }
      }
    );

    expect(() => assertSameOrigin(sameOrigin)).not.toThrow();
    expect(() => assertSameOrigin(crossOrigin)).toThrow(
      "Permintaan pembayaran tidak diizinkan"
    );
  });

  it("uses APP_URL as the production origin", () => {
    process.env.APP_URL = "https://pos.apotek.test";
    const request = new Request("https://internal.test/api/payments/accurate", {
      method: "POST",
      headers: { Origin: "https://pos.apotek.test" }
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("requires the explicit payment gateway feature flag", () => {
    process.env.PAYMENT_GATEWAY_ENABLED = "false";
    expect(() => assertPaymentGatewayEnabled()).toThrow(
      "Payment gateway belum diaktifkan pada server"
    );

    process.env.PAYMENT_GATEWAY_ENABLED = "true";
    expect(() => assertPaymentGatewayEnabled()).not.toThrow();
  });

  it("limits repeated payment creation attempts", () => {
    const key = `test-${Date.now()}`;
    for (let index = 0; index < 20; index += 1) {
      expect(() => assertPaymentRateLimit(key)).not.toThrow();
    }
    expect(() => assertPaymentRateLimit(key)).toThrow(
      "Terlalu banyak permintaan pembayaran"
    );
  });
});
