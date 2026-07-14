import { timingSafeEqual } from "node:crypto";
import {
  PaymentConfigurationError,
  PaymentValidationError
} from "./paymentErrors";

const rateLimitState = new Map<string, { count: number; resetAt: number }>();

export function verifyXenditCallbackToken(
  receivedToken: string | null,
  expectedToken: string | undefined
) {
  if (!receivedToken || !expectedToken) {
    return false;
  }

  const received = Buffer.from(receivedToken);
  const expected = Buffer.from(expectedToken);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function assertSameOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigin = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : requestOrigin;
  const origin = request.headers.get("origin");

  if (origin !== allowedOrigin) {
    throw new PaymentValidationError("Permintaan pembayaran tidak diizinkan");
  }
}

export function assertPaymentGatewayEnabled() {
  if (process.env.PAYMENT_GATEWAY_ENABLED !== "true") {
    throw new PaymentConfigurationError(
      "Payment gateway belum diaktifkan pada server"
    );
  }
}

export function assertPaymentRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimitState.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitState.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (current.count >= 20) {
    throw new PaymentValidationError(
      "Terlalu banyak permintaan pembayaran. Coba lagi sebentar."
    );
  }
  current.count += 1;
}
