"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  assignRider,
  getOrder,
  refundOrder,
  resolveFailedDelivery,
  updateOrderStatus,
} from "@/lib/services/orders.service";
import { getConversationForOrder } from "@/lib/services/conversations.service";
import { listRiders } from "@/lib/services/riders.service";
import { toOrderDetail, type OrderDetail } from "@/lib/mappers/order.mapper";
import { toRiderRow, type RiderRow } from "@/lib/mappers/rider.mapper";
import type { ActivityRow } from "@/lib/mappers/activity.mapper";
import { loadOrderHistory } from "./_lib/order-history";
import { can, getPermissions } from "@/lib/auth/guard";
import type { DeliveryResolution, OrderStatus } from "@/lib/types/enums";

/** Statuses an order never leaves, so there is nobody left to dispatch to. */
const ENDED: OrderStatus[] = ["delivered", "undelivered", "cancelled", "rejected", "refunded"];

export type OrderQuickView = {
  order: OrderDetail;
  /** Approved riders online now — only fetched when the order can still take one. */
  availableRiders: RiderRow[];
  conversation: { id: number; messageCount: number | null } | null;
  /**
   * What staff have done to this order, newest first. Null without
   * `audit.view` — the dialog then leaves the tab out rather than showing an
   * empty one that reads as "nobody has touched it".
   */
  history: ActivityRow[] | null;
  permissions: {
    canUpdateStatus: boolean;
    canRefund: boolean;
    canAssignRider: boolean;
  };
};

/**
 * Everything the order quick view needs, in one round trip.
 *
 * The permissions travel with the order rather than being threaded down from
 * each list: an order can be opened from the orders board, a payment, a refund,
 * a ledger line or a review, and none of those screens should have to know
 * what the order dialog does with them.
 */
export async function loadOrderQuickViewAction(id: number) {
  return apiAction<OrderQuickView>("Order retrieved", async () => {
    const permissions = await getPermissions();
    const canAssignRider = can(permissions, "orders.assign_rider");

    const [order, conversation] = await Promise.all([
      getOrder(id).then(toOrderDetail),
      can(permissions, "chat.view") ? getConversationForOrder(id).catch(() => null) : null,
    ]);

    // The picker is the only reader, and it has nothing to offer once the
    // order has ended or the food is already with a rider.
    const assignable =
      canAssignRider &&
      can(permissions, "riders.view") &&
      !ENDED.includes(order.status) &&
      order.dispatch.pickedUpAt === null;

    const [availableRiders, history] = await Promise.all([
      assignable
        ? listRiders({ status: "approved", is_online: true, per_page: 50 }).then((page) =>
            page.items.map(toRiderRow),
          )
        : Promise.resolve([]),
      can(permissions, "audit.view")
        ? // Never at the cost of the order itself: an audit-log hiccup should
          // lose the History tab, not the whole quick view.
          loadOrderHistory(id, conversation?.id ?? null).catch(() => null)
        : Promise.resolve(null),
    ]);

    return {
      order,
      availableRiders,
      history,
      conversation: conversation
        ? {
            id: conversation.id,
            messageCount:
              typeof conversation.message_count === "number" ? conversation.message_count : null,
          }
        : null,
      permissions: {
        canUpdateStatus: can(permissions, "orders.update_status"),
        canRefund: can(permissions, "payments.refund"),
        canAssignRider,
      },
    };
  });
}

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
    // The lists too: the rider column changes, and the order can be assigned
    // from a quick view without ever visiting its own page.
    revalidatePath("/dashboard/orders");
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
