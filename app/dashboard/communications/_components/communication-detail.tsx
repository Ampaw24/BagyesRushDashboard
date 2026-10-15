import { StatTile } from "../../_components/stat-tile";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import { BellIcon, CheckCircleIcon, DangerIcon, UsersIcon } from "../../_lib/icons";
import type {
  CommunicationRecipientRow,
  CommunicationRow,
} from "@/lib/mappers/communication.mapper";

/**
 * The pieces of one broadcast, shared by the full page and the quick-view
 * dialog. Stateless, so either can render them.
 */

const RECIPIENT_STATUS_CLASS: Record<string, string> = {
  sent: "text-status-good",
  failed: "text-status-critical",
  // Nothing went wrong — there was simply nowhere to send it.
  skipped: "text-text-muted",
  pending: "text-status-info",
};

export function CommunicationStats({
  communication,
  className = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
}: {
  communication: CommunicationRow;
  className?: string;
}) {
  return (
    <div className={className}>
      <StatTile
        label="Recipients"
        value={communication.recipients.toLocaleString()}
        icon={<UsersIcon />}
      />
      <StatTile label="Delivered" value={communication.sent.toLocaleString()} icon={<CheckCircleIcon />} />
      <StatTile label="Failed" value={communication.failed.toLocaleString()} icon={<DangerIcon />} />
      <StatTile
        label="Delivery rate"
        value={communication.deliveryRate === null ? "—" : `${communication.deliveryRate}%`}
        icon={<BellIcon />}
      />
    </div>
  );
}

export function CommunicationMessage({ communication }: { communication: CommunicationRow }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Message</h2>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Push</span>
        <p className="break-words font-medium text-foreground">{communication.title}</p>
        <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
          {communication.body}
        </p>
      </div>

      {communication.smsBody && (
        <div className="flex flex-col gap-1 border-t border-border-subtle pt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">SMS</span>
          <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
            {communication.smsBody}
          </p>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 text-sm sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs uppercase tracking-wide text-text-muted">Composed by</dt>
          <dd className="break-words text-foreground">{communication.authorEmail ?? "—"}</dd>
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
          <dd className="text-foreground">{formatDateTimeOrDash(communication.completedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

/**
 * Who it actually reached. The counters say "9,842 sent"; this says whether it
 * reached that particular vendor, and why not when it didn't.
 */
export function CommunicationRecipientsTable({ rows }: { rows: CommunicationRecipientRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border-subtle bg-surface p-5 text-sm text-text-muted shadow-sm">
        No recipients yet. Rows appear once this has been sent.
      </p>
    );
  }

  return (
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
              {row.error && <span className="block text-xs text-text-muted">{row.error}</span>}
            </TableCell>
            <TableCell>
              <span className="text-text-secondary">{formatDateTimeOrDash(row.sentAt)}</span>
            </TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
