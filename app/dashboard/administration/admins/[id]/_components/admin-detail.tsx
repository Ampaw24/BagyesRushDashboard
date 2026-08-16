"use client";

import type { ReactNode } from "react";

import { ActionMenu } from "../../../../_components/action-menu";
import { Avatar } from "../../../../_components/avatar";
import { Badge } from "../../../../_components/status-badge";
import { PageHeader } from "../../../../_components/page-header";
import { userStatusMeta } from "../../../../_lib/status";
import { formatDate, formatDateTimeOrDash } from "../../../../_lib/format";
import { useAdminActions, type AdminActionContext } from "../../../../_hooks/use-admin-actions";
import type { AdminUserRow } from "@/lib/mappers/admin-user.mapper";

export function AdminDetail({
  admin,
  activitySlot,
  context,
}: {
  admin: AdminUserRow;
  /**
   * The audit table, rendered by the server page and passed through as a slot.
   * This component needs `useAdminActions`, so it is a Client Component — and
   * importing the table here would drag the API client into the browser bundle.
   */
  activitySlot: ReactNode;
  context: AdminActionContext;
}) {
  const { actions, dialog } = useAdminActions(admin, context);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={admin.email} className="h-10 w-10 text-sm" />
            {/* No name column exists on the users table — the email identifies them. */}
            {admin.email}
            <Badge meta={userStatusMeta[admin.status]} />
          </span>
        }
        description={`${admin.adminRoleLabel} · joined ${formatDate(admin.createdAt)}`}
        action={actions.length > 0 ? <ActionMenu items={actions} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <h2 className="break-words text-sm font-semibold text-foreground">Account</h2>
          <dl className="flex flex-col gap-2">
            <Row label="Email" value={admin.email} />
            <Row label="Phone" value={admin.phone} />
            <Row label="Phone verified" value={admin.phoneVerified ? "Yes" : "No"} />
            <Row label="Role" value={admin.adminRoleLabel} />
            <Row label="Last login" value={formatDateTimeOrDash(admin.lastLoginAt)} />
          </dl>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">
          Recorded activity
        </h2>
        {activitySlot}
      </section>

      {dialog}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
