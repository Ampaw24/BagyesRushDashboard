"use client";

import { useState } from "react";
import { ConfirmDialog } from "../_components/confirm-dialog";
import type { ActionMenuItem } from "../_components/action-menu";
import { DangerIcon, RefreshIcon, TrashIcon } from "../_lib/icons";
import type { Customer } from "../_services/mock-data";

type PendingAction = "ban" | "unban" | "delete" | null;

export function useCustomerActions(customer: Customer, onUpdate: (updates: Partial<Customer>) => void, onDelete: () => void) {
  const [pending, setPending] = useState<PendingAction>(null);

  function commitUpdate(updates: Partial<Customer>) {
    onUpdate(updates);
    setPending(null);
  }

  const quickActions: ActionMenuItem[] =
    customer.status === "banned"
      ? [{ label: "Unban customer", icon: RefreshIcon, onClick: () => setPending("unban") }]
      : [{ label: "Ban customer", icon: DangerIcon, onClick: () => setPending("ban"), danger: true }];

  const deleteAction: ActionMenuItem = { label: "Delete customer", icon: TrashIcon, onClick: () => setPending("delete"), danger: true };

  let dialog: React.ReactNode = null;

  if (pending === "ban") {
    dialog = (
      <ConfirmDialog
        title="Ban customer"
        description={`${customer.name} will lose access to their account and won't be able to place new orders.`}
        confirmLabel="Ban customer"
        danger
        requireReason
        onConfirm={() => commitUpdate({ status: "banned" })}
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "unban") {
    dialog = (
      <ConfirmDialog
        title="Unban customer"
        description={`Restore ${customer.name}'s access to their account.`}
        confirmLabel="Unban customer"
        onConfirm={() => commitUpdate({ status: "active" })}
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "delete") {
    dialog = (
      <ConfirmDialog
        title="Delete customer"
        description={`This permanently removes ${customer.name} from the customer list. This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          onDelete();
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    );
  }

  return { quickActions, deleteAction, dialog };
}
