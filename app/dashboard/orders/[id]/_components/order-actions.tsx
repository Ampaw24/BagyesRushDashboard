"use client";

import { useState } from "react";

import { ActionMenu, type ActionMenuItem } from "../../../_components/action-menu";
import { ConfirmDialog } from "../../../_components/confirm-dialog";
import { useToast } from "../../../_components/toast-provider";
import { refundOrderAction, updateOrderStatusAction } from "../../_actions";
import type { OrderDetail } from "@/lib/mappers/order.mapper";
import type { OrderStatus } from "@/lib/types/enums";

type Pending =
  | { kind: "status"; status: OrderStatus; label: string }
  | { kind: "refund" };

/**
 * Status and refund controls for one order.
 *
 * The options come from `allowed_transitions` on the resource, which the
 * backend derives from OrderStatus::transitions() — so the UI can only ever
 * offer a move the API would accept.
 */
export function OrderActions({
  order,
  canUpdateStatus,
  canRefund,
}: {
  order: OrderDetail;
  canUpdateStatus: boolean;
  canRefund: boolean;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const { notifySuccess } = useToast();

  const items: ActionMenuItem[] = [];

  if (canUpdateStatus) {
    for (const transition of order.allowedTransitions) {
      items.push({
        label: `Mark as ${transition.label.toLowerCase()}`,
        danger: transition.value === "cancelled" || transition.value === "rejected",
        onClick: () => setPending({ kind: "status", status: transition.value, label: transition.label }),
      });
    }
  }

  if (canRefund) {
    items.push({
      label: "Refund order",
      danger: true,
      // The backend refuses a refund unless a settled payment exists.
      disabled: !order.isPaid,
      disabledReason: "This order has not been paid for.",
      onClick: () => setPending({ kind: "refund" }),
    });
  }

  if (items.length === 0) {
    return <span className="text-sm text-text-muted">No actions available</span>;
  }

  return (
    <>
      <ActionMenu items={items} />

      {pending?.kind === "status" && (
        <ConfirmDialog
          title={`Mark order as ${pending.label.toLowerCase()}?`}
          description={`Order ${order.orderNumber} will move to "${pending.label}". The customer and vendor are notified.`}
          confirmLabel={pending.label}
          danger={pending.status === "cancelled" || pending.status === "rejected"}
          // The backend stores this against rejection_reason or
          // cancellation_reason; it is optional for every other transition.
          requireReason={pending.status === "cancelled" || pending.status === "rejected"}
          reasonLabel="Reason"
          reasonMinLength={5}
          onCancel={() => setPending(null)}
          onConfirm={async (reason) => {
            const result = await updateOrderStatusAction(order.id, pending.status, reason);
            notifySuccess(result);
            if (result.ok) setPending(null);
            return result;
          }}
        />
      )}

      {pending?.kind === "refund" && (
        <ConfirmDialog
          title="Refund this order?"
          description={`This sends a refund request to the payment provider for order ${order.orderNumber}. It cannot be undone.`}
          confirmLabel="Refund"
          danger
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            const result = await refundOrderAction(order.id);
            notifySuccess(result);
            if (result.ok) setPending(null);
            return result;
          }}
        />
      )}
    </>
  );
}
