import { NextResponse } from "next/server";
import { createPaymentDependencies } from "@/server/payments/paymentDependencies";
import { paymentErrorResponse } from "@/server/payments/paymentHttp";
import { handleXenditWebhook } from "@/server/payments/paymentManager";
import { xenditWebhookSchema } from "@/server/payments/paymentSchemas";
import { verifyXenditCallbackToken } from "@/server/payments/paymentSecurity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (
    !verifyXenditCallbackToken(
      request.headers.get("x-callback-token"),
      process.env.XENDIT_CALLBACK_TOKEN
    )
  ) {
    return NextResponse.json({ message: "Callback tidak sah" }, { status: 401 });
  }

  try {
    const payload = xenditWebhookSchema.parse(await request.json());
    const data = await handleXenditWebhook(
      payload,
      createPaymentDependencies()
    );
    return NextResponse.json({ data });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
