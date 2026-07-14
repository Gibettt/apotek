import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentRepository } from "./paymentRepository";
import {
  createAccuratePayment,
  handleXenditWebhook,
  refreshAccuratePayment,
  type PaymentManagerDependencies
} from "./paymentManager";
import { PaymentConfigurationError } from "./paymentErrors";

const reference = "APOTEK-5dc04f7a-91ab-4fe7-a519-8459f26c04df";
const pricedItems = [
  {
    obatId: 12,
    code: "OBT-PAY",
    name: "Obat Bayar",
    quantity: 1,
    unitPrice: 30000
  }
];
const pendingRecord = {
  id: 88,
  reference,
  number: "PJL-20260713-00088",
  total: 30000,
  status: "PENDING" as const,
  providerId: undefined,
  paymentUrl: undefined,
  expiresAt: undefined,
  accurateSyncStatus: "PENDING"
};

function repositoryMock(): PaymentRepository {
  return {
    findByReference: vi.fn().mockResolvedValue(null),
    prepareItems: vi.fn().mockResolvedValue(pricedItems),
    createPendingSale: vi.fn().mockResolvedValue(pendingRecord),
    attachProviderPayment: vi.fn().mockImplementation(async (_id, payment) => ({
      ...pendingRecord,
      providerId: payment.providerId,
      paymentUrl: payment.paymentUrl,
      expiresAt: payment.expiresAt
    })),
    markPaymentFailed: vi.fn().mockResolvedValue(undefined),
    markPaymentExpired: vi.fn().mockResolvedValue(undefined),
    finalizePayment: vi.fn().mockResolvedValue(88),
    loadAccurateInvoice: vi.fn().mockResolvedValue({
      number: pendingRecord.number,
      date: new Date("2026-07-13T03:00:00.000Z"),
      customerNo: "UMUM",
      items: pricedItems
    }),
    markAccurateSync: vi.fn().mockResolvedValue(undefined)
  };
}

describe("payment manager", () => {
  let repository: PaymentRepository;
  let dependencies: PaymentManagerDependencies;

  beforeEach(() => {
    repository = repositoryMock();
    dependencies = {
      repository,
      createProviderLink: vi.fn().mockResolvedValue({
        providerId: "inv-123",
        reference,
        status: "PENDING",
        paymentUrl: "https://checkout.xendit.test/inv-123",
        expiresAt: "2026-07-13T10:30:00.000Z",
        amount: 30000
      }),
      getProviderLink: vi.fn(),
      syncAccurateInvoice: vi.fn().mockResolvedValue({
        id: 991,
        number: pendingRecord.number
      })
    };
  });

  it("uses server-priced items and stores the provider payment", async () => {
    const result = await createAccuratePayment(
      {
        idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
        items: [{ obatId: 12, quantity: 1 }]
      },
      dependencies
    );

    expect(repository.prepareItems).toHaveBeenCalledWith([
      { obatId: 12, quantity: 1 }
    ]);
    expect(dependencies.createProviderLink).toHaveBeenCalledWith({
      reference,
      amount: 30000,
      items: pricedItems
    });
    expect(result.paymentUrl).toBe(
      "https://checkout.xendit.test/inv-123"
    );
  });

  it("returns the existing payment for the same idempotency key", async () => {
    vi.mocked(repository.findByReference).mockResolvedValue({
      ...pendingRecord,
      providerId: "inv-123",
      paymentUrl: "https://checkout.xendit.test/inv-123"
    });

    await createAccuratePayment(
      {
        idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
        items: [{ obatId: 12, quantity: 1 }]
      },
      dependencies
    );

    expect(repository.prepareItems).not.toHaveBeenCalled();
    expect(dependencies.createProviderLink).not.toHaveBeenCalled();
  });

  it("marks the pending sale failed when provider creation fails", async () => {
    vi.mocked(dependencies.createProviderLink).mockRejectedValue(
      new Error("provider unavailable")
    );

    await expect(
      createAccuratePayment(
        {
          idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
          items: [{ obatId: 12, quantity: 1 }]
        },
        dependencies
      )
    ).rejects.toThrow("provider unavailable");
    expect(repository.markPaymentFailed).toHaveBeenCalledWith(88);
  });

  it("does not create another provider link after an idempotency race", async () => {
    vi.mocked(repository.createPendingSale).mockResolvedValue({
      ...pendingRecord,
      providerId: "inv-existing",
      paymentUrl: "https://checkout.xendit.test/inv-existing"
    });

    const result = await createAccuratePayment(
      {
        idempotencyKey: "5dc04f7a-91ab-4fe7-a519-8459f26c04df",
        items: [{ obatId: 12, quantity: 1 }]
      },
      dependencies
    );

    expect(result.paymentUrl).toContain("inv-existing");
    expect(dependencies.createProviderLink).not.toHaveBeenCalled();
  });

  it("finalizes a paid callback and syncs the sale to Accurate", async () => {
    vi.mocked(repository.findByReference).mockResolvedValue({
      ...pendingRecord,
      providerId: "inv-123",
      paymentUrl: "https://checkout.xendit.test/inv-123"
    });

    await handleXenditWebhook(
      {
        id: "inv-123",
        external_id: reference,
        status: "PAID",
        amount: 30000,
        paid_amount: 30000,
        payment_id: "pay-123"
      },
      dependencies
    );

    expect(repository.finalizePayment).toHaveBeenCalledWith(
      reference,
      "pay-123"
    );
    expect(dependencies.syncAccurateInvoice).toHaveBeenCalled();
    expect(repository.markAccurateSync).toHaveBeenCalledWith(88, "SYNCED", 991);
  });

  it("rejects a paid callback whose amount differs from the sale", async () => {
    vi.mocked(repository.findByReference).mockResolvedValue({
      ...pendingRecord,
      providerId: "inv-123"
    });

    await expect(
      handleXenditWebhook(
        {
          id: "inv-123",
          external_id: reference,
          status: "PAID",
          amount: 1,
          paid_amount: 1
        },
        dependencies
      )
    ).rejects.toThrow("Nominal callback pembayaran tidak sesuai");
    expect(repository.finalizePayment).not.toHaveBeenCalled();
  });

  it("marks an expired callback without finalizing stock", async () => {
    vi.mocked(repository.findByReference).mockResolvedValue({
      ...pendingRecord,
      providerId: "inv-123"
    });

    const result = await handleXenditWebhook(
      {
        id: "inv-123",
        external_id: reference,
        status: "EXPIRED",
        amount: 30000
      },
      dependencies
    );

    expect(result.status).toBe("EXPIRED");
    expect(repository.markPaymentExpired).toHaveBeenCalledWith(reference);
    expect(repository.finalizePayment).not.toHaveBeenCalled();
  });

  it("refreshes a pending payment from Xendit", async () => {
    vi.mocked(repository.findByReference).mockResolvedValue({
      ...pendingRecord,
      providerId: "inv-123"
    });
    vi.mocked(dependencies.getProviderLink).mockResolvedValue({
      providerId: "inv-123",
      reference,
      status: "PAID",
      paymentUrl: "https://checkout.xendit.test/inv-123",
      expiresAt: "2026-07-13T10:30:00.000Z",
      amount: 30000
    });

    const result = await refreshAccuratePayment(reference, dependencies);

    expect(result.status).toBe("PAID");
    expect(repository.finalizePayment).toHaveBeenCalled();
  });

  it("keeps a paid sale completed when Accurate is not configured", async () => {
    vi.mocked(repository.findByReference).mockResolvedValue({
      ...pendingRecord,
      status: "PAID",
      accurateSyncStatus: "PENDING"
    });
    vi.mocked(repository.loadAccurateInvoice).mockRejectedValue(
      new PaymentConfigurationError("Accurate missing")
    );

    const result = await refreshAccuratePayment(reference, dependencies);

    expect(result.status).toBe("PAID");
    expect(repository.markAccurateSync).toHaveBeenCalledWith(
      88,
      "PENDING_CONFIGURATION",
      undefined,
      "Accurate missing"
    );
  });

  it("returns terminal failed payments without contacting the provider", async () => {
    vi.mocked(repository.findByReference).mockResolvedValue({
      ...pendingRecord,
      status: "FAILED"
    });

    const result = await refreshAccuratePayment(reference, dependencies);

    expect(result.status).toBe("FAILED");
    expect(dependencies.getProviderLink).not.toHaveBeenCalled();
  });
});
