"use client";

import { useState } from "react";

import { ConfirmDialog } from "../_components/confirm-dialog";
import type { ActionMenuItem } from "../_components/action-menu";
import { ArchiveIcon, DangerIcon, RefreshIcon, StarIcon, VerifyIcon } from "../_lib/icons";
import { useToast } from "../_components/toast-provider";
import {
  approveVendorAction,
  deleteVendorAction,
  reinstateVendorAction,
  rejectVendorAction,
  restoreVendorAction,
  suspendVendorAction,
  toggleVendorFeaturedAction,
  toggleVendorOpenAction,
} from "../vendors/_actions";
import type { VendorRow } from "@/lib/mappers/vendor.mapper";
import { vendorStatusTransitions } from "@/lib/types/enums";

type PendingAction = "approve" | "reject" | "suspend" | "reinstate" | "feature" | "open" | "delete" | "restore" | null;

export type VendorActionPermissions = {
  canModerate: boolean;
  canDelete: boolean;
};

/**
 * Vendor lifecycle actions for one row.
 *
 * The available moves are derived from VendorStatus::transitions() rather than
 * hard-coded, so the menu can never offer a transition the backend would reject
 * with "A vendor cannot move from X to Y".
 */
export function useVendorStatusActions(
  vendor: VendorRow,
  { canModerate, canDelete }: VendorActionPermissions,
) {
  const [pending, setPending] = useState<PendingAction>(null);

  const allowed = vendorStatusTransitions[vendor.status] ?? [];
  const actions: ActionMenuItem[] = [];

  if (canModerate) {
    if (allowed.includes("approved")) {
      actions.push({
        label: vendor.status === "suspended" ? "Reinstate vendor" : "Approve vendor",
        icon: vendor.status === "suspended" ? RefreshIcon : VerifyIcon,
        onClick: () => setPending(vendor.status === "suspended" ? "reinstate" : "approve"),
      });
    }

    if (allowed.includes("rejected")) {
      actions.push({
        label: "Reject vendor",
        icon: DangerIcon,
        danger: true,
        onClick: () => setPending("reject"),
      });
    }

    if (allowed.includes("suspended")) {
      actions.push({
        label: "Suspend vendor",
        icon: DangerIcon,
        danger: true,
        onClick: () => setPending("suspend"),
      });
    }

    actions.push({
      label: vendor.isFeatured ? "Remove from featured" : "Feature vendor",
      icon: StarIcon,
      // The backend only allows featuring an approved vendor.
      disabled: vendor.status !== "approved",
      disabledReason: "Only an approved vendor can be featured.",
      onClick: () => setPending("feature"),
    });

    // Reads the vendor's own switch, not isOpenNow: this control flips their
    // intent, and whether that makes them visibly open depends on the clock.
    actions.push({
      label: vendor.isOpen ? "Close for orders" : "Open for orders",
      icon: RefreshIcon,
      disabled: vendor.status !== "approved" || !vendor.isActive,
      disabledReason: "Only an approved, active vendor can open for orders.",
      onClick: () => setPending("open"),
    });
  }

  if (canDelete) {
    actions.push({
      label: "Delete vendor",
      icon: ArchiveIcon,
      danger: true,
      onClick: () => setPending("delete"),
    });
  }

  const dialog = pending && (
    <VendorActionDialog vendor={vendor} action={pending} onClose={() => setPending(null)} />
  );

  return { actions, dialog };
}

function VendorActionDialog({
  vendor,
  action,
  onClose,
}: {
  vendor: VendorRow;
  action: Exclude<PendingAction, null>;
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();

  // Reject and suspend both take ModerateVendorRequest, which requires a
  // 10–255 character reason. Everything else takes no body.
  const needsReason = action === "reject" || action === "suspend";

  const copy: Record<Exclude<PendingAction, null>, { title: string; description: string; confirm: string; danger: boolean }> = {
    approve: {
      title: "Approve vendor",
      description: `${vendor.businessName} will go live and start receiving orders.`,
      confirm: "Approve",
      danger: false,
    },
    reject: {
      title: "Reject vendor",
      description: `${vendor.businessName} will be told their application was not accepted. They can reapply.`,
      confirm: "Reject",
      danger: true,
    },
    suspend: {
      title: "Suspend vendor",
      description: `${vendor.businessName} will stop receiving orders immediately.`,
      confirm: "Suspend",
      danger: true,
    },
    reinstate: {
      title: "Reinstate vendor",
      description: `${vendor.businessName} will be able to receive orders again.`,
      confirm: "Reinstate",
      danger: false,
    },
    open: {
      title: vendor.isOpen ? "Close for orders" : "Open for orders",
      // Says what will actually happen rather than what the switch says. A
      // vendor opened outside their hours stays closed to customers, and an
      // admin clicking this deserves to know that before they click.
      description: vendor.isOpen
        ? `${vendor.businessName} will stop receiving orders.`
        : vendor.closedReason === "closed_today"
          ? `${vendor.businessName} is not scheduled to trade today, so they will stay closed to customers until their next operating day.`
          : vendor.closedReason === "outside_hours"
            ? `${vendor.businessName} is outside their opening hours, so they will start receiving orders when those hours begin.`
            : `${vendor.businessName} will start receiving orders.`,
      confirm: vendor.isOpen ? "Close" : "Open",
      danger: false,
    },
    feature: {
      title: vendor.isFeatured ? "Remove from featured" : "Feature vendor",
      description: vendor.isFeatured
        ? `${vendor.businessName} will no longer appear in the featured list.`
        : `${vendor.businessName} will appear in the featured list in the customer app.`,
      confirm: vendor.isFeatured ? "Remove" : "Feature",
      danger: false,
    },
    delete: {
      title: "Delete vendor",
      description: `${vendor.businessName} will be removed from the marketplace. This is reversible, but it is refused while they have orders in progress.`,
      confirm: "Delete",
      danger: true,
    },
    restore: {
      title: "Restore vendor",
      description: `${vendor.businessName} will be returned to the marketplace.`,
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
        const result = await runVendorAction(action, vendor.id, reason ?? "");
        notifySuccess(result);
        if (result.ok) onClose();
        return result;
      }}
    />
  );
}

function runVendorAction(action: Exclude<PendingAction, null>, id: number, reason: string) {
  switch (action) {
    case "approve":
      return approveVendorAction(id);
    case "reject":
      return rejectVendorAction(id, reason);
    case "suspend":
      return suspendVendorAction(id, reason);
    case "reinstate":
      return reinstateVendorAction(id);
    case "feature":
      return toggleVendorFeaturedAction(id);
    case "open":
      return toggleVendorOpenAction(id);
    case "delete":
      return deleteVendorAction(id);
    case "restore":
      return restoreVendorAction(id);
  }
}
