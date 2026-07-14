import { NextResponse } from "next/server";
import { createPaymentDependencies } from "@/server/payments/paymentDependencies";
import { paymentErrorResponse } from "@/server/payments/paymentHttp";
import { refreshAccuratePayment } from "@/server/payments/paymentManager";
import { assertPaymentGatewayEnabled } from "@/server/payments/paymentSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { reference: string } }
) {
  try {
    assertPaymentGatewayEnabled();
    const data = await refreshAccuratePayment(
      decodeURIComponent(params.reference),
      createPaymentDependencies()
    );
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
