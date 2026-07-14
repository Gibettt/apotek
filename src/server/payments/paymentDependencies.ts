import { createAccurateSalesInvoice } from "./accurateClient";
import { createPaymentRepository } from "./paymentRepository";
import type { PaymentManagerDependencies } from "./paymentManager";
import {
  createXenditPaymentSession,
  getXenditPaymentSession
} from "./xenditClient";

export function createPaymentDependencies(): PaymentManagerDependencies {
  return {
    repository: createPaymentRepository(),
    createProviderLink: createXenditPaymentSession,
    getProviderLink: getXenditPaymentSession,
    syncAccurateInvoice: (input) =>
      createAccurateSalesInvoice(input, {
        warehouseName: process.env.ACCURATE_WAREHOUSE_NAME
      })
  };
}
