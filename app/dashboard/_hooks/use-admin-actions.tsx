"use client";

import { useState } from "react";
import { ConfirmDialog } from "../_components/confirm-dialog";
import type { ActionMenuItem } from "../_components/action-menu";
import { canRemoveAdmin, isLastActiveSuperAdmin } from "../_lib/administration";
import type { AdminUser } from "../_services/mock-data";

type PendingAction = "suspend" | "activate" | "remove" | null;

export function useAdminActions(admin: AdminUser, activeSuperAdminCount: number, onUpdate: (updates: Partial<AdminUser>) => void) {
  const [pending, setPending] = useState<PendingAction>(null);

  function commit(updates: Partial<AdminUser>) {
    onUpdate(updates);
    setPending(null);
  }

  const isLastSuperAdmin = isLastActiveSuperAdmin(admin, activeSuperAdminCount);

  const actions: ActionMenuItem[] = [
    {
      label: "Suspend",
      onClick: () => setPending("suspend"),
      disabled: admin.status !== "active" || isLastSuperAdmin,
      disabledReason: isLastSuperAdmin ? "At least one active Super Admin must remain." : undefined,
    },
    { label: "Activate", onClick: () => setPending("activate"), disabled: admin.status === "active" },
    {
      label: "Remove admin access",
      onClick: () => setPending("remove"),
      disabled: !canRemoveAdmin(admin, activeSuperAdminCount),
      disabledReason: isLastSuperAdmin ? "At least one active Super Admin must remain." : undefined,
      danger: true,
    },
  ];

  let dialog: React.ReactNode = null;

  if (pending === "suspend") {
    dialog = (
      <ConfirmDialog
        title="Suspend administrator"
        description={`${admin.name} will lose access to protected dashboard functions until reactivated.`}
        confirmLabel="Suspend"
        danger
        requireReason
        onConfirm={() => commit({ status: "suspended" })}
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "activate") {
    dialog = (
      <ConfirmDialog
        title="Reactivate administrator"
        description={`Restore ${admin.name}'s access to the dashboard.`}
        confirmLabel="Activate"
        onConfirm={() => commit({ status: "active" })}
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "remove") {
    dialog = (
      <ConfirmDialog
        title="Remove admin access"
        description={`This action will remove ${admin.name}'s administrative access and may revoke active sessions.`}
        confirmLabel="Remove access"
        danger
        requireReason
        onConfirm={() => commit({ status: "removed" })}
        onCancel={() => setPending(null)}
      />
    );
  }

  return { actions, dialog };
}
