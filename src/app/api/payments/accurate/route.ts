import { NextResponse } from "next/server";
import { createPaymentDependencies } from "@/server/payments/paymentDependencies";
import { paymentErrorResponse } from "@/server/payments/paymentHttp";
import { createAccuratePayment } from "@/server/payments/paymentManager";
import { createAccuratePaymentSchema } from "@/server/payments/paymentSchemas";
import {
  assertPaymentGatewayEnabled,
  assertPaymentRateLimit,
  assertSameOrigin
} from "@/server/payments/paymentSecurity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertPaymentGatewayEnabled();
    assertSameOrigin(request);
    assertPaymentRateLimit(
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
    );
    const payload = createAccuratePaymentSchema.parse(await request.json());
    const data = await createAccuratePayment(
      payload,
      createPaymentDependencies()
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
