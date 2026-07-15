import { z } from "zod";

const paymentItemSchema = z.object({
  barangId: z.string().uuid(),
  quantity: z.number().int().positive().max(999)
});

export const createAccuratePaymentSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    items: z.array(paymentItemSchema).min(1).max(100)
  })
  .superRefine((payload, context) => {
    const ids = payload.items.map((item) => item.barangId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Obat yang sama tidak boleh dikirim lebih dari sekali"
      });
    }
  });

export const xenditWebhookSchema = z
  .object({
    event: z.enum(["payment_session.completed", "payment_session.expired"]),
    business_id: z.string().min(1),
    created: z.string().min(1),
    data: z.object({
      payment_session_id: z.string().min(1),
      reference_id: z.string().min(1),
      status: z.enum(["COMPLETED", "EXPIRED"]),
      amount: z.number().positive(),
      payment_id: z.string().min(1).nullish()
    })
  })
  .superRefine((payload, context) => {
    const expectedStatus =
      payload.event === "payment_session.completed" ? "COMPLETED" : "EXPIRED";
    if (payload.data.status !== expectedStatus) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data", "status"],
        message: "Status webhook tidak sesuai dengan event"
      });
    }
  })
  .transform((payload) => ({
    id: payload.data.payment_session_id,
    external_id: payload.data.reference_id,
    status: payload.data.status === "COMPLETED" ? ("PAID" as const) : ("EXPIRED" as const),
    amount: payload.data.amount,
    paid_amount:
      payload.data.status === "COMPLETED" ? payload.data.amount : undefined,
    payment_id: payload.data.payment_id ?? undefined
  }));

export type CreateAccuratePaymentInput = z.infer<
  typeof createAccuratePaymentSchema
>;
export interface XenditWebhookInput {
  id: string;
  external_id: string;
  status: "PENDING" | "PAID" | "EXPIRED";
  amount: number;
  paid_amount?: number;
  payment_id?: string;
}
