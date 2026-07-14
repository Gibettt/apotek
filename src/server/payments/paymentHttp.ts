import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  PaymentConfigurationError,
  PaymentNotFoundError,
  PaymentProviderError,
  PaymentValidationError
} from "./paymentErrors";

export function paymentErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: error.issues[0]?.message ?? "Data pembayaran tidak valid" },
      { status: 400 }
    );
  }
  if (error instanceof PaymentValidationError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  if (error instanceof PaymentNotFoundError) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
  if (error instanceof PaymentConfigurationError) {
    return NextResponse.json({ message: error.message }, { status: 503 });
  }
  if (error instanceof PaymentProviderError) {
    return NextResponse.json({ message: error.message }, { status: 502 });
  }

  console.error("Payment operation failed", error);
  return NextResponse.json(
    { message: "Pembayaran belum dapat diproses. Silakan coba lagi." },
    { status: 500 }
  );
}
