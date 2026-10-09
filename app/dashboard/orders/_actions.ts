"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  assignRider,
  refundOrder,
  resolveFailedDelivery,
  updateOrderStatus,
} from "@/lib/services/orders.service";
import type { DeliveryResolution, OrderStatus } from "@/lib/types/enums";

/**
 * Order mutations.
 *
 * Server Actions are reachable by direct POST, not only through the UI, so the
 * backend's permission middleware is the real gate here — these wrappers just
 * carry the session cookie and normalise the result for the dialogs.
 */

export async function updateOrderStatusAction(id: number, status: OrderStatus, reason?: string) {
  return apiAction("Order status updated", async () => {
    await updateOrderStatus(id, status, reason);
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);
  });
}

export async function resolveFailedDeliveryAction(
  id: number,
  input: { outcome: DeliveryResolution; note?: string; pay_rider?: boolean },
) {
  return apiAction("Delivery resolved", async () => {
    await resolveFailedDelivery(id, input);
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);
    revalidatePath("/dashboard/orders/failed-deliveries");
  });
}

export async function assignRiderAction(id: number, riderId: number) {
  return apiAction("Rider assigned", async () => {
    await assignRider(id, riderId);
    revalidatePath(`/dashboard/orders/${id}`);
  });
}

export async function refundOrderAction(
  id: number,
  input: { amount?: number; destination?: "source" | "wallet"; reason?: string } = {},
) {
  return apiAction(
    input.destination === "wallet"
      ? "Refunded to the customer's wallet"
      : "Refund sent to the payment provider",
    async () => {
      await refundOrder(id, input);
      revalidatePath("/dashboard/orders");
      revalidatePath(`/dashboard/orders/${id}`);
      revalidatePath("/dashboard/orders/failed-deliveries");
    },
  );
}
