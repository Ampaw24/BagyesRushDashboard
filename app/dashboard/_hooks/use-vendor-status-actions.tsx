"use client";

import { useState } from "react";
import { ConfirmDialog } from "../_components/confirm-dialog";
import type { ActionMenuItem } from "../_components/action-menu";
import { ArchiveIcon, DangerIcon, RefreshIcon, VerifyIcon, XCircleIcon } from "../_lib/icons";
import type { Vendor } from "../_services/vendors-mock-data";

type PendingAction = "verify" | "reject" | "suspend" | "activate" | "archive" | null;

export function useVendorStatusActions(vendor: Vendor, onUpdate: (updates: Partial<Vendor>) => void) {
  const [pending, setPending] = useState<PendingAction>(null);

  function commit(updates: Partial<Vendor>) {
    onUpdate({ ...updates, updatedAt: new Date() });
    setPending(null);
  }

  const actions: ActionMenuItem[] = [
    { label: "Verify vendor", icon: VerifyIcon, onClick: () => setPending("verify"), disabled: vendor.verificationStatus === "verified" },
    { label: "Reject application", icon: XCircleIcon, onClick: () => setPending("reject"), disabled: vendor.verificationStatus === "rejected" },
    {
      label: "Suspend vendor",
      icon: DangerIcon,
      onClick: () => setPending("suspend"),
      disabled: vendor.status === "suspended" || vendor.status === "archived",
      danger: true,
    },
    { label: "Activate vendor", icon: RefreshIcon, onClick: () => setPending("activate"), disabled: vendor.status === "active" },
    { label: "Archive vendor", icon: ArchiveIcon, onClick: () => setPending("archive"), disabled: vendor.status === "archived", danger: true },
  ];

  let dialog: React.ReactNode = null;

  if (pending === "verify") {
    dialog = (
      <ConfirmDialog
        title="Verify vendor"
        description={`Mark ${vendor.businessName} as a verified vendor.`}
        confirmLabel="Verify"
        onConfirm={() => commit({ verificationStatus: "verified", rejectionReason: undefined })}
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "reject") {
    dialog = (
      <ConfirmDialog
        title="Reject application"
        description={`Reject ${vendor.businessName}'s vendor application. They will be notified with your reason.`}
        confirmLabel="Reject"
        danger
        requireReason
        reasonLabel="Rejection reason"
        onConfirm={(reason) => commit({ verificationStatus: "rejected", rejectionReason: reason })}
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "suspend") {
    dialog = (
      <ConfirmDialog
        title="Suspend vendor"
        description={`${vendor.businessName} will no longer accept new orders or appear as available to customers. Historical records remain intact.`}
        confirmLabel="Suspend"
        danger
        requireReason
        reasonLabel="Suspension reason"
        onConfirm={(reason) =>
          commit({ status: "suspended", suspension: { reason: reason ?? "Administrative action", effectiveAt: new Date(), endAt: null } })
        }
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "activate") {
    dialog = (
      <ConfirmDialog
        title="Activate vendor"
        description={`Reactivate ${vendor.businessName}? It will become available to customers again.`}
        confirmLabel="Activate"
        onConfirm={() => commit({ status: "active", suspension: undefined })}
        onCancel={() => setPending(null)}
      />
    );
  } else if (pending === "archive") {
    dialog = (
      <ConfirmDialog
        title="Archive vendor"
        description="Are you sure you want to archive this vendor? Archived vendors will no longer be available to customers, but their historical orders, payments, and records will remain accessible."
        confirmLabel="Archive"
        danger
        onConfirm={() => commit({ status: "archived" })}
        onCancel={() => setPending(null)}
      />
    );
  }

  return { actions, dialog };
}
