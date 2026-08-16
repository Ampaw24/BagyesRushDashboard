"use client";

import { useState } from "react";

import { ConfirmDialog } from "../_components/confirm-dialog";
import type { ActionMenuItem } from "../_components/action-menu";
import { DangerIcon, RefreshIcon, ShieldIcon, UnlockIcon } from "../_lib/icons";
import { useToast } from "../_components/toast-provider";
import { canChangeRole, canSuspendAdmin } from "../_lib/administration";
import {
  assignAdminRoleAction,
  reinstateAdminUserAction,
  resetAdminPasswordAction,
  suspendAdminUserAction,
} from "../admin-users/_actions";
import type { AdminUserRow } from "@/lib/mappers/admin-user.mapper";
import { ADMIN_ROLES, adminRoleLabels, type AdminRole } from "@/lib/types/enums";

type Pending =
  | { kind: "suspend" }
  | { kind: "reinstate" }
  | { kind: "reset-password" }
  | { kind: "role"; role: AdminRole }
  | null;

export type AdminActionContext = {
  currentAdminId: number;
  activeSuperAdminCount: number;
  canManage: boolean;
  canAssignRole: boolean;
};

/**
 * Suspend / reinstate / reset-password / change-role for one staff account.
 *
 * The self-suspension and last-super-admin rules are enforced by the backend;
 * they are mirrored here only to disable the menu item with an explanation
 * instead of surfacing a 422 after the click.
 */
export function useAdminActions(admin: AdminUserRow, context: AdminActionContext) {
  const [pending, setPending] = useState<Pending>(null);
  const [password, setPassword] = useState<string | null>(null);
  const { notifySuccess } = useToast();

  const actions: ActionMenuItem[] = [];

  if (context.canManage) {
    if (admin.status === "suspended") {
      actions.push({
        label: "Reinstate account",
        icon: RefreshIcon,
        onClick: () => setPending({ kind: "reinstate" }),
      });
    } else {
      const suspend = canSuspendAdmin(admin, context.currentAdminId, context.activeSuperAdminCount);
      actions.push({
        label: "Suspend account",
        icon: DangerIcon,
        danger: true,
        disabled: !suspend.allowed,
        disabledReason: suspend.reason,
        onClick: () => setPending({ kind: "suspend" }),
      });
    }

    actions.push({
      label: "Reset password",
      icon: UnlockIcon,
      onClick: () => setPending({ kind: "reset-password" }),
    });
  }

  if (context.canAssignRole) {
    const change = canChangeRole(admin, context.currentAdminId, context.activeSuperAdminCount);

    for (const role of ADMIN_ROLES) {
      if (role === admin.adminRole) continue;
      actions.push({
        label: `Make ${adminRoleLabels[role].toLowerCase()}`,
        icon: ShieldIcon,
        disabled: !change.allowed,
        disabledReason: change.reason,
        onClick: () => setPending({ kind: "role", role }),
      });
    }
  }

  let dialog: React.ReactNode = null;

  if (password !== null) {
    dialog = (
      <ConfirmDialog
        title="New password"
        description={`Share this with ${admin.email} now — it is not stored and cannot be shown again.`}
        confirmLabel="Done"
        cancelLabel="Close"
        onCancel={() => setPassword(null)}
        onConfirm={() => setPassword(null)}
      >
        <output className="break-all rounded-lg border border-border-subtle bg-surface-muted px-4 py-3 font-mono text-sm text-foreground">
          {password}
        </output>
      </ConfirmDialog>
    );
  } else if (pending?.kind === "suspend") {
    dialog = (
      <ConfirmDialog
        title="Suspend account"
        description={`${admin.email} will be signed out and blocked from the dashboard.`}
        confirmLabel="Suspend"
        danger
        requireReason
        reasonMinLength={5}
        onCancel={() => setPending(null)}
        onConfirm={async (reason) => {
          const result = await suspendAdminUserAction(admin.id, reason ?? "");
          notifySuccess(result);
          if (result.ok) setPending(null);
          return result;
        }}
      />
    );
  } else if (pending?.kind === "reinstate") {
    dialog = (
      <ConfirmDialog
        title="Reinstate account"
        description={`${admin.email} will be able to sign in again with their existing role.`}
        confirmLabel="Reinstate"
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const result = await reinstateAdminUserAction(admin.id);
          notifySuccess(result);
          if (result.ok) setPending(null);
          return result;
        }}
      />
    );
  } else if (pending?.kind === "reset-password") {
    dialog = (
      <ConfirmDialog
        title="Reset password"
        description={`A new password will be generated for ${admin.email}. Their current one stops working immediately.`}
        confirmLabel="Reset password"
        danger
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const result = await resetAdminPasswordAction(admin.id);
          notifySuccess(result);
          if (result.ok) {
            setPending(null);
            setPassword(result.data.password);
          }
          return result;
        }}
      />
    );
  } else if (pending?.kind === "role") {
    dialog = (
      <ConfirmDialog
        title="Change role"
        description={`${admin.email} will become ${adminRoleLabels[pending.role]}. This changes their dashboard access immediately and signs out their existing sessions.`}
        confirmLabel="Change role"
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const result = await assignAdminRoleAction(admin.id, pending.role);
          notifySuccess(result);
          if (result.ok) setPending(null);
          return result;
        }}
      />
    );
  }

  return { actions, dialog };
}
