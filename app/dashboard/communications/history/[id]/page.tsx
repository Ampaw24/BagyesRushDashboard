import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "../../../_components/page-header";
import { NoPermissionState } from "../../../_components/empty-state";
import { Badge } from "../../../_components/status-badge";
import { StatTile } from "../../../_components/stat-tile";
import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { Pagination } from "../../../_components/pagination";
import { communicationStatusMeta } from "../../../_lib/status";
import { formatDateTime, formatDateTimeOrDash } from "../../../_lib/format";
import { BellIcon, CheckCircleIcon, DangerIcon, UsersIcon } from "../../../_lib/icons";
import {
  getCommunication,
  listCommunicationRecipients,
} from "@/lib/services/communications.service";
import {
  toCommunicationRecipientRow,
  toCommunicationRow,
} from "@/lib/mappers/communication.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { parseListParams } from "@/lib/api/query";
import { ApiRequestError } from "@/lib/api/errors";

export const metadata: Metadata = {
  title: "Communication — BagyesRUSH",
};

const RECIPIENT_STATUS_CLASS: Record<string, string> = {
  sent: "text-status-good",
  failed: "text-status-critical",
  // Nothing went wrong — there was simply nowhere to send it.
  skipped: "text-text-muted",
  pending: "text-status-info",
};

/**
 * One broadcast, and who it actually reached.
 *
 * The recipient table is the point of the page: the counters say "9,842 sent",
 * this says whether it reached that particular vendor, and why not when it
 * didn't.
 */
export default async function CommunicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Communication" description="One broadcast and its delivery." />
        <NoPermissionState what="communications" />
      </div>
    );
  }

  const { id } = await params;
  const communicationId = Number.parseInt(id, 10);

  if (!Number.isFinite(communicationId)) notFound();

  const list = parseListParams(await searchParams);

  let communication;
  try {
    communication = toCommunicationRow(await getCommunication(communicationId));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const recipients = await listCommunicationRecipients(communicationId, {
    page: list.page,
    per_page: list.per_page,
  });

  const rows = recipients.items.map(toCommunicationRecipientRow);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={communication.title}
        description={`${communication.channelLabel} to ${communication.audienceLabel.toLowerCase()}`}
        action={<Badge meta={communicationStatusMeta[communication.status]} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Recipients"
          value={communication.recipients.toLocaleString()}
          icon={<UsersIcon />}
        />
        <StatTile
          label="Delivered"
          value={communication.sent.toLocaleString()}
          icon={<CheckCircleIcon />}
        />
        <StatTile
          label="Failed"
          value={communication.failed.toLocaleString()}
          icon={<DangerIcon />}
        />
        <StatTile
          label="Delivery rate"
          value={communication.deliveryRate === null ? "—" : `${communication.deliveryRate}%`}
          icon={<BellIcon />}
        />
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Message</h2>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Push
          </span>
          <p className="font-medium text-foreground">{communication.title}</p>
          <p className="whitespace-pre-wrap text-sm text-text-secondary">{communication.body}</p>
        </div>

        {communication.smsBody && (
          <div className="flex flex-col gap-1 border-t border-border-subtle pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">SMS</span>
            <p className="whitespace-pre-wrap text-sm text-text-secondary">
              {communication.smsBody}
            </p>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs uppercase tracking-wide text-text-muted">Composed by</dt>
            <dd className="text-foreground">{communication.authorEmail ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs uppercase tracking-wide text-text-muted">
              {communication.status === "scheduled" ? "Scheduled for" : "Created"}
            </dt>
            <dd className="text-foreground">
              {communication.status === "scheduled"
                ? formatDateTimeOrDash(communication.scheduledAt)
                : formatDateTime(communication.createdAt)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs uppercase tracking-wide text-text-muted">Completed</dt>
            <dd className="text-foreground">
              {formatDateTimeOrDash(communication.completedAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Delivery</h2>
          <Link
            href="/dashboard/communications/history"
            className="text-sm text-text-muted transition duration-150 hover:text-foreground"
          >
            Back to history
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-border-subtle bg-surface p-5 text-sm text-text-muted shadow-sm">
            No recipients yet. Rows appear once this has been sent.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Recipient</TableHeadCell>
                <TableHeadCell>Role</TableHeadCell>
                <TableHeadCell>Channel</TableHeadCell>
                <TableHeadCell>Outcome</TableHeadCell>
                <TableHeadCell>Sent</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="transition duration-150 hover:bg-surface-muted">
                  <TableCell>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{row.name}</span>
                      <span className="text-xs text-text-muted">
                        {row.channel === "sms" ? (row.phone ?? row.email) : row.email}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-text-secondary">{row.role}</span>
                  </TableCell>
                  <TableCell>
                    <span className="uppercase text-text-secondary">{row.channel}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`capitalize ${RECIPIENT_STATUS_CLASS[row.status] ?? ""}`}>
                      {row.status}
                    </span>
                    {row.error && (
                      <span className="block text-xs text-text-muted">{row.error}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">{formatDateTimeOrDash(row.sentAt)}</span>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}

        <Pagination pagination={recipients.pagination} />
      </section>
    </div>
  );
}
