import { describe, expect, it } from "vitest";
import {
  createAccuratePaymentSchema,
  xenditWebhookSchema
} from "./paymentSchemas";

describe("payment schemas", () => {
  it("accepts item identity and quantity without a client supplied amount", () => {
    const result = createAccuratePaymentSchema.parse({
      idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
      amount: 1,
      items: [{ barangId: "b6a1a9d0-1234-4a11-8a11-000000000012", quantity: 2 }]
    });

    expect(result).toEqual({
      idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
      items: [{ barangId: "b6a1a9d0-1234-4a11-8a11-000000000012", quantity: 2 }]
    });
  });

  it("rejects duplicate medicines and invalid quantities", () => {
    const duplicate = createAccuratePaymentSchema.safeParse({
      idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
      items: [
        { barangId: "b6a1a9d0-1234-4a11-8a11-000000000012", quantity: 1 },
        { barangId: "b6a1a9d0-1234-4a11-8a11-000000000012", quantity: 2 }
      ]
    });
    const invalidQuantity = createAccuratePaymentSchema.safeParse({
      idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
      items: [{ barangId: "b6a1a9d0-1234-4a11-8a11-000000000012", quantity: 0 }]
    });

    expect(duplicate.success).toBe(false);
    expect(invalidQuantity.success).toBe(false);
  });

  it("only accepts supported Xendit payment states", () => {
    const completed = xenditWebhookSchema.safeParse({
      event: "payment_session.completed",
      business_id: "business-id",
      created: "2026-07-13T10:30:00.000Z",
      data: {
        payment_session_id: "ps-661f87c614802d6c402cd82d",
        reference_id: "APOTEK-123",
        status: "COMPLETED",
        amount: 30000,
        payment_id: "py-123"
      }
    });

    expect(completed.success).toBe(true);
    if (completed.success) {
      expect(completed.data).toEqual({
        id: "ps-661f87c614802d6c402cd82d",
        external_id: "APOTEK-123",
        status: "PAID",
        amount: 30000,
        paid_amount: 30000,
        payment_id: "py-123"
      });
    }
    expect(
      xenditWebhookSchema.safeParse({
        event: "payment_session.completed",
        business_id: "business-id",
        created: "2026-07-13T10:30:00.000Z",
        data: {
          payment_session_id: "ps-661f87c614802d6c402cd82d",
          reference_id: "APOTEK-123",
          status: "EXPIRED",
          amount: 30000
        }
      }).success
    ).toBe(false);
  });

  it("normalizes an expired Payment Session webhook", () => {
    const result = xenditWebhookSchema.parse({
      event: "payment_session.expired",
      business_id: "business-id",
      created: "2026-07-13T10:30:00.000Z",
      data: {
        payment_session_id: "ps-661f87c614802d6c402cd82d",
        reference_id: "APOTEK-123",
        status: "EXPIRED",
        amount: 30000
      }
    });

    expect(result).toEqual({
      id: "ps-661f87c614802d6c402cd82d",
      external_id: "APOTEK-123",
      status: "EXPIRED",
      amount: 30000,
      paid_amount: undefined,
      payment_id: undefined
    });
  });
});
