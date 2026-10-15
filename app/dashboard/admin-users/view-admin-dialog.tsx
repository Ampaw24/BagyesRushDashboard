"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ActionMenu } from "../_components/action-menu";
import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { DetailDialog, DetailField, DetailSection } from "../_components/detail-dialog";
import { userStatusMeta } from "../_lib/status";
import { formatDate, formatDateTime, formatDateTimeOrDash } from "../_lib/format";
import { useAdminActions, type AdminActionContext } from "../_hooks/use-admin-actions";
import { loadAdminActivityAction } from "./_actions";
import type { AdminUserRow } from "@/lib/mappers/admin-user.mapper";
import type { ActivityRow } from "@/lib/mappers/activity.mapper";

/**
 * A staff account at a glance, with every action the list offers.
 *
 * The account fields come from the list row, so the dialog opens complete and
 * stays current: each action revalidates the list, and the new row flows in.
 * Only the recent activity is fetched, and only for those who may read it.
 */
export function ViewAdminDialog({
  admin,
  context,
  onClose,
}: {
  admin: AdminUserRow;
  context: AdminActionContext;
  onClose: () => void;
}) {
  const { actions, dialog } = useAdminActions(admin, context);
  const [activity, setActivity] = useState<{ items: ActivityRow[]; total: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Keyed on the status too: suspending or reinstating writes an audit entry,
  // and a trail that does not show the action just taken looks broken.
  useEffect(() => {
    let active = true;

    loadAdminActivityAction(admin.id).then((result) => {
      if (!active) return;
      setActivity(result.ok ? result.data : null);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [admin.id, admin.status, admin.adminRole]);

  return (
    <DetailDialog
      label="View staff account"
      onClose={onClose}
      className="max-w-2xl"
      header={
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={admin.name ?? admin.email} className="h-12 w-12 text-base" />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="flex flex-wrap items-center gap-2 break-words text-base font-semibold text-foreground">
              {admin.name ?? admin.email}
              {admin.id === context.currentAdminId && (
                <span className="text-xs font-normal text-text-muted">(you)</span>
              )}
            </h2>
            <span className="break-words text-xs text-text-muted">
              {admin.adminRoleLabel} · joined {formatDate(admin.createdAt)}
            </span>
            <span className="pt-0.5">
              <Badge meta={userStatusMeta[admin.status]} />
            </span>
          </div>
        </div>
      }
      footer={
        <>
          {actions.length > 0 && <ActionMenu items={actions} />}
          <Link
            href={`/dashboard/administration/admins/${admin.id}`}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Open full profile
          </Link>
        </>
      }
    >
      <DetailSection title="Account">
        <DetailField label="Name" value={admin.name ?? "—"} />
        <DetailField label="Email" value={admin.email} />
        <DetailField label="Phone" value={admin.phone} />
        <DetailField label="Phone verified" value={admin.phoneVerified ? "Yes" : "No"} />
        <DetailField label="Role" value={admin.adminRoleLabel} />
        <DetailField label="Last login" value={formatDateTimeOrDash(admin.lastLoginAt)} />
      </DetailSection>

      {!loaded ? (
        <p className="py-6 text-center text-sm text-text-muted">Loading activity…</p>
      ) : (
        activity && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
              {activity.total > activity.items.length && (
                <span className="text-xs text-text-muted">
                  Latest {activity.items.length} of {activity.total.toLocaleString()} — the full
                  trail is on their profile
                </span>
              )}
            </div>

            {activity.items.length === 0 ? (
              <p className="rounded-xl border border-border-subtle p-4 text-sm text-text-muted">
                Nothing recorded yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle">
                {activity.items.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-0.5 px-4 py-3">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {entry.actionLabel}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </span>
                    <span className="break-words text-xs text-text-secondary">
                      {entry.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      )}

      {dialog}
    </DetailDialog>
  );
}
