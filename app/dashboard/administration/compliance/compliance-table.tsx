"use client";

import { useState, useTransition } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { RelativeTime } from "../../_components/relative-time";
import { DetailDialog } from "../../_components/detail-dialog";
import { useToast } from "../../_components/toast-provider";
import { retryComplianceLogAction } from "./_actions";
import type { ComplianceLogDto } from "@/lib/types/api";

/**
 * Deliveries as filed with the Postal and Courier Services Regulatory Commission.
 *
 * One row per delivery, not per order: a parcel run with three drops is three
 * filings, each with its own recipient for the NIA to verify. The reference is
 * what the Commission knows the delivery by, so it leads — somebody arrives at
 * this screen because that reference was quoted at them.
 *
 * Both parties are shown with their own verification state rather than one rolled
 * up status, because "partly verified" is only actionable once you can see which
 * half failed.
 */
export function ComplianceTable({
  logs,
  canRetry,
}: {
  logs: ComplianceLogDto[];
  canRetry: boolean;
}) {
  const { notify } = useToast();
  const [pending, start] = useTransition();

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Reference</TableHeadCell>
          <TableHeadCell>Sender</TableHeadCell>
          <TableHeadCell>Recipient</TableHeadCell>
          <TableHeadCell>Journey</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Filed</TableHeadCell>
          <TableHeadCell>
            <span className="sr-only">Actions</span>
          </TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <TableCell className="font-medium">
              {log.reference}
              <span className="mt-0.5 block text-xs font-normal text-text-muted">
                {log.order.order_number ?? `Order #${log.order.id}`}
              </span>
            </TableCell>

            <TableCell>
              <PartyCell
                name={log.sender.full_name}
                phone={log.sender.phone}
                status={log.sender.status}
              />
            </TableCell>

            <TableCell>
              <PartyCell
                name={log.recipient.full_name}
                phone={log.recipient.phone}
                status={log.recipient.status}
              />
            </TableCell>

            <TableCell className="max-w-xs">
              <span className="block truncate text-sm" title={log.pickup_location}>
                {log.pickup_location}
              </span>
              <span
                className="mt-0.5 block truncate text-xs text-text-muted"
                title={log.delivery_location}
              >
                → {log.delivery_location}
              </span>
            </TableCell>

            <TableCell>
              <StatusPill label={log.status_label} concerning={log.needs_attention} />
              {/* The reason is the whole value of the row when something failed:
                  "not a valid Ghanaian number" is fixable, a timeout is not. */}
              {log.failure_reason && (
                <span className="mt-1 block max-w-xs text-xs text-status-critical">
                  {log.failure_reason}
                </span>
              )}
              {log.attempts > 1 && (
                <span className="mt-0.5 block text-xs text-text-muted">
                  {log.attempts} attempts
                </span>
              )}
              {log.rejected_webhook && <RefusedCallback log={log} />}
            </TableCell>

            <TableCell className="text-sm text-text-secondary">
              {log.submitted_at ? (
                <RelativeTime date={log.submitted_at} />
              ) : (
                <span className="text-text-muted">not yet</span>
              )}
              {log.verified_at && (
                <span className="mt-0.5 block text-xs text-status-good">
                  verified <RelativeTime date={log.verified_at} />
                </span>
              )}
            </TableCell>

            <TableCell className="text-right">
              {canRetry && log.can_retry ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => notify(await retryComplianceLogAction(log.id)))
                  }
                  className="inline-flex h-9 items-center rounded-lg border border-border-subtle px-3 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-50"
                >
                  File again
                </button>
              ) : (
                <span className="text-xs text-text-muted">—</span>
              )}
            </TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

/**
 * One party, with whatever the NIA said about them.
 *
 * `null` is not a failure — it means the check has not come back yet, which is the
 * normal state for the first minutes after filing and must not be dressed up as a
 * problem.
 */
function PartyCell({
  name,
  phone,
  status,
}: {
  name: string;
  phone: string;
  status: string | null;
}) {
  const verified = status === "verified";

  return (
    <>
      <span className="block text-sm">{name || <span className="text-text-muted">—</span>}</span>
      <span className="mt-0.5 block text-xs text-text-muted">{phone}</span>
      <span
        className={`mt-0.5 block text-xs ${
          status === null
            ? "text-text-muted"
            : verified
              ? "text-status-good"
              : "text-status-critical"
        }`}
      >
        {status === null ? "awaiting check" : verified ? "verified" : status}
      </span>
    </>
  );
}

/**
 * A callback iCOLMS sent that we did not believe.
 *
 * Shown so staff can tell the two causes apart, which call for opposite fixes:
 * a forged or misdirected callback (refusing it was right), or iCOLMS returning
 * a different number than the one we submitted - for example the number on the
 * person's NIA record - in which case the check itself needs to change.
 */
function RefusedCallback({ log }: { log: ComplianceLogDto }) {
  const [open, setOpen] = useState(false);
  const refused = log.rejected_webhook;

  if (!refused) return null;

  return (
    <>
      <span className="mt-1 block max-w-xs text-xs text-amber-700 dark:text-amber-400">
        Callback refused <RelativeTime date={refused.received_at} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-1.5 font-medium underline underline-offset-2 transition duration-150 hover:opacity-80"
        >
          View
        </button>
      </span>

      {open && (
        <DetailDialog
          label="Refused iCOLMS callback"
          onClose={() => setOpen(false)}
          className="max-w-2xl"
          header={
            <div className="flex flex-col gap-1">
              <h2 className="break-words text-base font-semibold text-foreground">
                Refused callback for {log.reference}
              </h2>
              <p className="break-words text-sm text-text-secondary">
                {refused.reason ?? "It did not match what was filed."} It was not trusted, and the
                filing&apos;s status is unchanged.
              </p>
            </div>
          }
        >
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Sender we filed</dt>
              <dd className="break-words font-medium text-foreground">
                {log.sender.full_name || "—"} · {log.sender.phone}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Recipient we filed</dt>
              <dd className="break-words font-medium text-foreground">
                {log.recipient.full_name || "—"} · {log.recipient.phone}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              What iCOLMS sent
            </span>
            <pre className="max-h-96 overflow-auto rounded-lg border border-border-subtle bg-surface-muted p-3 text-xs text-foreground">
              {JSON.stringify(refused.payload, null, 2)}
            </pre>
          </div>
        </DetailDialog>
      )}
    </>
  );
}

function StatusPill({ label, concerning }: { label: string; concerning: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
        concerning
          ? "bg-status-critical/10 text-status-critical"
          : "bg-surface-muted text-text-secondary"
      }`}
    >
      {label}
    </span>
  );
}
