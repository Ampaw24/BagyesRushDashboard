"use client";

import { useState } from "react";
import { PageHeader } from "../../../../_components/page-header";
import { Avatar } from "../../../../_components/avatar";
import { Badge } from "../../../../_components/status-badge";
import { ActionMenu } from "../../../../_components/action-menu";
import { ConfirmDialog } from "../../../../_components/confirm-dialog";
import { useAdminActions } from "../../../../_hooks/use-admin-actions";
import { adminRoleMeta, adminStatusMeta } from "../../../../_lib/status";
import { auditActionMeta, canChangeRole } from "../../../../_lib/administration";
import { formatDateTime } from "../../../../_lib/format";
import type { AdminRole, AdminUser } from "../../../../_services/mock-data";
import type { AuditLogEntry, Permission, RoleDefinition } from "../../../../_services/administration-mock-data";

type AdminDetailProps = {
  admin: AdminUser;
  actorRole: AdminRole;
  isSelf: boolean;
  roles: RoleDefinition[];
  permissions: Permission[];
  activeSuperAdminCount: number;
  activity: AuditLogEntry[];
};

export function AdminDetail({ admin: initialAdmin, actorRole, isSelf, roles, permissions, activeSuperAdminCount, activity }: AdminDetailProps) {
  const [admin, setAdmin] = useState(initialAdmin);
  const [pendingRole, setPendingRole] = useState<AdminRole | null>(null);
  const { actions, dialog } = useAdminActions(admin, activeSuperAdminCount, (updates) => setAdmin((prev) => ({ ...prev, ...updates })));

  const currentRoleDef = roles.find((r) => r.role === admin.role);
  const isSelfLastSuperAdmin = isSelf && admin.role === "super_admin" && activeSuperAdminCount <= 1;

  function attemptRoleChange(newRole: AdminRole) {
    if (newRole === admin.role) return;
    if (!canChangeRole(actorRole, admin.role, newRole)) return;
    if (isSelfLastSuperAdmin) return;
    setPendingRole(newRole);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={admin.name} className="h-10 w-10 text-sm" />
            {admin.name}
          </span>
        }
        description={admin.email}
        action={
          <div className="flex items-center gap-2">
            <Badge meta={adminStatusMeta[admin.status]} />
            <ActionMenu items={actions} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Role assignment</h3>
          <div className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3 text-sm">
            <span className="text-text-muted">Current role</span>
            <span className="font-medium text-foreground">{adminRoleMeta[admin.role].label}</span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text-secondary">Change role</p>
            {roles.map((r) => {
              const disabled = r.role === admin.role || !canChangeRole(actorRole, admin.role, r.role) || isSelfLastSuperAdmin;
              return (
                <label
                  key={r.role}
                  className={`flex min-h-11 items-center gap-2.5 rounded-lg border border-border-subtle px-3 py-2 ${
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={admin.role === r.role}
                    disabled={disabled}
                    onChange={() => attemptRoleChange(r.role)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{r.label}</span>
                    <span className="text-xs text-text-muted">{r.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {actorRole !== "super_admin" && (
            <p className="text-xs text-text-muted">Only a Super Admin can change roles for another administrator or grant Super Admin access.</p>
          )}
          {isSelfLastSuperAdmin && <p className="text-xs text-text-muted">You are the last active Super Admin — your role can&apos;t be changed here.</p>}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
          <p className="text-xs text-text-muted">Granted by the {currentRoleDef?.label} role.</p>
          <ul className="flex flex-col gap-1.5">
            {permissions.map((p) => {
              const granted = currentRoleDef?.permissions.includes(p.key) ?? false;
              return (
                <li key={p.key} className={`flex items-center gap-2 text-sm ${granted ? "text-foreground" : "text-text-muted line-through"}`}>
                  <span aria-hidden="true">{granted ? "☑" : "☐"}</span>
                  {p.label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Activity</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-text-muted">No recorded activity for this administrator yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activity.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{auditActionMeta[log.action].label}</span>
                  {log.reason && <span className="text-xs text-text-secondary">{log.reason}</span>}
                  <span className="text-xs text-text-muted">by {log.actor}</span>
                </div>
                <span className="shrink-0 text-xs text-text-muted">{formatDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialog}

      {pendingRole && (
        <ConfirmDialog
          title="Change role"
          description={`Change ${admin.name}'s role from ${adminRoleMeta[admin.role].label} to ${adminRoleMeta[pendingRole].label}? This immediately changes their dashboard access.`}
          confirmLabel="Change role"
          onConfirm={() => {
            setAdmin((prev) => ({ ...prev, role: pendingRole }));
            setPendingRole(null);
          }}
          onCancel={() => setPendingRole(null)}
        />
      )}
    </div>
  );
}
