"use client";

import { useState } from "react";
import { ConfirmDialog } from "../_components/confirm-dialog";
import type { ActionMenuItem } from "../_components/action-menu";
import { DangerIcon, RefreshIcon } from "../_lib/icons";
import { useToast } from "../_components/toast-provider";
import {
  reinstateCustomerAction,
  suspendCustomerAction,
} from "../users/_actions";
import type { CustomerRow } from "@/lib/mappers/customer.mapper";

type PendingAction = "suspend" | "reinstate" | null;

/**
 * Suspend / reinstate for one customer.
 *
 * These now call the API through Server Actions instead of mutating a local
 * array, so the dialog stays open and reports the message if the backend
 * refuses. Deleting a customer is not offered: no such endpoint exists.
 */
export function useCustomerActions(customer: CustomerRow) {
  const [pending, setPending] = useState<PendingAction>(null);
  const { notifySuccess } = useToast();

  const actions: ActionMenuItem[] =
    customer.status === "suspended"
      ? [{ label: "Reinstate customer", icon: RefreshIcon, onClick: () => setPending("reinstate") }]
      : [
          {
            label: "Suspend customer",
            icon: DangerIcon,
            danger: true,
            onClick: () => setPending("suspend"),
          },
        ];

  let dialog: React.ReactNode = null;

  if (pending === "suspend") {
    dialog = (
      <ConfirmDialog
        title="Suspend customer"
        description={`${customer.fullName} will lose access to their account and won't be able to place new orders.`}
        confirmLabel="Suspend customer"
        danger
        requireReason
        // The backend's ReasonRequest enforces 5–255 characters.
        reasonMinLength={5}
        onCancel={() => setPending(null)}
        onConfirm={async (reason) => {
          const result = await suspendCustomerAction(customer.id, reason ?? "");
          notifySuccess(result);
          if (result.ok) setPending(null);
          return result;
        }}
      />
    );
  } else if (pending === "reinstate") {
    dialog = (
      <ConfirmDialog
        title="Reinstate customer"
        description={`Restore ${customer.fullName}'s access to their account.`}
        confirmLabel="Reinstate"
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const result = await reinstateCustomerAction(customer.id);
          notifySuccess(result);
          if (result.ok) setPending(null);
          return result;
        }}
      />
    );
  }

  return { actions, dialog };
}
