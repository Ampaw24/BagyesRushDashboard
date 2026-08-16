"use client";

import Link from "next/link";
import { useState } from "react";

import { ActionMenu } from "../_components/action-menu";
import { Badge } from "../_components/status-badge";
import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { EmptyState } from "../_components/empty-state";
import { Pagination } from "../_components/pagination";
import { FilterBar, type SelectFilter } from "../_components/filter-bar";
import { userStatusMeta } from "../_lib/status";
import { PlusIcon } from "../_lib/icons";
import { formatDate, formatDateTimeOrDash } from "../_lib/format";
import { useAdminActions, type AdminActionContext } from "../_hooks/use-admin-actions";
import { NewStaffDialog } from "./new-staff-dialog";
import type { AdminUserRow } from "@/lib/mappers/admin-user.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { ADMIN_ROLES, USER_STATUSES, adminRoleLabels, userStatusLabels } from "@/lib/types/enums";

const ROLE_FILTER: SelectFilter = {
  key: "admin_role",
  label: "Role",
  allLabel: "All roles",
  options: ADMIN_ROLES.map((role) => ({ value: role, label: adminRoleLabels[role] })),
};

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: USER_STATUSES.map((status) => ({ value: status, label: userStatusLabels[status] })),
};

export function AdminUsersTable({
  admins,
  pagination,
  context,
}: {
  admins: AdminUserRow[];
  pagination: PaginationMeta;
  context: AdminActionContext;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search email or phone" filters={[ROLE_FILTER, STATUS_FILTER]} />
        {context.canManage && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            <PlusIcon className="h-4 w-4" />
            New staff account
          </button>
        )}
      </div>

      {admins.length === 0 ? (
        <EmptyState
          title="No staff accounts match your filters"
          description="Try a different search term, role or status."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Account</TableHeadCell>
                <TableHeadCell>Phone</TableHeadCell>
                <TableHeadCell>Role</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Last login</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <AdminRowView key={admin.id} admin={admin} context={context} />
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {creating && <NewStaffDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function AdminRowView({ admin, context }: { admin: AdminUserRow; context: AdminActionContext }) {
  const { actions, dialog } = useAdminActions(admin, context);

  return (
    <tr>
      <TableCell className="font-medium">
        <Link
          href={`/dashboard/administration/admins/${admin.id}`}
          className="text-brand transition duration-150 hover:opacity-80"
        >
          {/* The users table has no name column — the email is the identifier. */}
          {admin.email}
        </Link>
        {admin.id === context.currentAdminId && (
          <span className="ml-2 text-xs font-normal text-text-muted">(you)</span>
        )}
      </TableCell>
      <TableCell className="text-text-secondary">{admin.phone}</TableCell>
      <TableCell className="text-text-secondary">{admin.adminRoleLabel}</TableCell>
      <TableCell>
        <Badge meta={userStatusMeta[admin.status]} />
      </TableCell>
      <TableCell className="text-text-secondary">{formatDateTimeOrDash(admin.lastLoginAt)}</TableCell>
      <TableCell className="text-text-secondary">{formatDate(admin.createdAt)}</TableCell>
      <TableCell>
        {actions.length > 0 ? <ActionMenu items={actions} /> : <span className="text-text-muted">—</span>}
        {dialog}
      </TableCell>
    </tr>
  );
}
