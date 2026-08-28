"use client";

import { useState } from "react";

import { ConfirmDialog } from "../_components/confirm-dialog";
import type { ActionMenuItem } from "../_components/action-menu";
import { ArchiveIcon, DangerIcon, RefreshIcon, VerifyIcon } from "../_lib/icons";
import { useToast } from "../_components/toast-provider";
import {
  approveRiderAction,
  deleteRiderAction,
  reinstateRiderAction,
  rejectRiderAction,
  restoreRiderAction,
  suspendRiderAction,
} from "../riders/_actions";
import type { RiderRow } from "@/lib/mappers/rider.mapper";
import { riderStatusTransitions } from "@/lib/types/enums";

type PendingAction = "approve" | "reject" | "suspend" | "reinstate" | "delete" | "restore" | null;

export type RiderActionPermissions = {
  canModerate: boolean;
  canDelete: boolean;
};

/**
 * Rider lifecycle actions for one row.
 *
 * The available moves come from RiderStatus::allowedTransitions() rather than
 * being hard-coded, so the menu can never offer a move the backend would reject
 * with "A rider cannot move from X to Y".
 */
export function useRiderStatusActions(
  rider: RiderRow,
  { canModerate, canDelete }: RiderActionPermissions,
) {
  const [pending, setPending] = useState<PendingAction>(null);

  const deleted = rider.derivedState === "deleted";
  const allowed = riderStatusTransitions[rider.status] ?? [];
  const actions: ActionMenuItem[] = [];

  if (canModerate && !deleted) {
    if (allowed.includes("approved")) {
      const reinstating = rider.status === "suspended";

      actions.push({
        label: reinstating ? "Reinstate rider" : "Approve rider",
        icon: reinstating ? RefreshIcon : VerifyIcon,
        // Approving someone who has not finished onboarding means approving
        // documents that were never uploaded.
        disabled: !reinstating && !rider.isProfileComplete,
        disabledReason: "This rider has not completed their profile yet.",
        onClick: () => setPending(reinstating ? "reinstate" : "approve"),
      });
    }

    if (allowed.includes("rejected")) {
      actions.push({
        label: "Reject rider",
        icon: DangerIcon,
        danger: true,
        onClick: () => setPending("reject"),
      });
    }

    if (allowed.includes("suspended")) {
      actions.push({
        label: "Block rider",
        icon: DangerIcon,
        danger: true,
        onClick: () => setPending("suspend"),
      });
    }
  }

  if (canDelete) {
    actions.push(
      deleted
        ? { label: "Restore rider", icon: RefreshIcon, onClick: () => setPending("restore") }
        : { label: "Delete rider", icon: ArchiveIcon, danger: true, onClick: () => setPending("delete") },
    );
  }

  const dialog = pending && (
    <RiderActionDialog rider={rider} action={pending} onClose={() => setPending(null)} />
  );

  return { actions, dialog };
}

function RiderActionDialog({
  rider,
  action,
  onClose,
}: {
  rider: RiderRow;
  action: Exclude<PendingAction, null>;
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();

  // Reject and suspend both require a 10–255 character reason: it is what the
  // rider is shown in the SMS they receive, and what makes the decision
  // auditable.
  const needsReason = action === "reject" || action === "suspend";

  const copy: Record<
    Exclude<PendingAction, null>,
    { title: string; description: string; confirm: string; danger: boolean }
  > = {
    approve: {
      title: "Approve rider",
      description: `${rider.name} will be able to go online and start accepting deliveries. They are texted and pushed.`,
      confirm: "Approve",
      danger: false,
    },
    reject: {
      title: "Reject rider",
      description: `${rider.name} will be told their application was not accepted, along with the reason. They can fix it and reapply.`,
      confirm: "Reject",
      danger: true,
    },
    suspend: {
      title: "Block rider",
      description: `${rider.name} goes offline immediately and stops receiving jobs. They are signed out and told why.`,
      confirm: "Block",
      danger: true,
    },
    reinstate: {
      title: "Reinstate rider",
      description: `${rider.name} will be able to go online and accept deliveries again.`,
      confirm: "Reinstate",
      danger: false,
    },
    delete: {
      title: "Delete rider",
      description: `${rider.name} will be removed. This is reversible, but it is refused while they still have a delivery in progress.`,
      confirm: "Delete",
      danger: true,
    },
    restore: {
      title: "Restore rider",
      description: `${rider.name} will be brought back with their previous status.`,
      confirm: "Restore",
      danger: false,
    },
  };

  const { title, description, confirm, danger } = copy[action];

  return (
    <ConfirmDialog
      title={title}
      description={description}
      confirmLabel={confirm}
      danger={danger}
      requireReason={needsReason}
      reasonMinLength={needsReason ? 10 : 1}
      onCancel={onClose}
      onConfirm={async (reason) => {
        const result = await runRiderAction(action, rider.id, reason ?? "");
        notifySuccess(result);
        if (result.ok) onClose();
        return result;
      }}
    />
  );
}

function runRiderAction(action: Exclude<PendingAction, null>, id: number, reason: string) {
  switch (action) {
    case "approve":
      return approveRiderAction(id);
    case "reject":
      return rejectRiderAction(id, reason);
    case "suspend":
      return suspendRiderAction(id, reason);
    case "reinstate":
      return reinstateRiderAction(id);
    case "delete":
      return deleteRiderAction(id);
    case "restore":
      return restoreRiderAction(id);
  }
}
