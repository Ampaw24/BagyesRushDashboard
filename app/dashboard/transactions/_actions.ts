"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { verifyPayment } from "@/lib/services/payments.service";

/**
 * Re-checks a payment attempt against the gateway. Requires `payments.verify`.
 * Useful when a webhook was missed and an order is stuck on "pending payment".
 */
export async function verifyPaymentAction(id: number) {
  return apiAction("Payment re-checked with the gateway", async () => {
    await verifyPayment(id);
    revalidatePath("/dashboard/transactions/payments");
  });
}
