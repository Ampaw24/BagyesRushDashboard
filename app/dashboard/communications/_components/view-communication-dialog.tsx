"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DetailDialog, DialogTabs } from "../../_components/detail-dialog";
import { Badge } from "../../_components/status-badge";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { communicationStatusMeta } from "../../_lib/status";
import {
  CommunicationMessage,
  CommunicationRecipientsTable,
  CommunicationStats,
} from "./communication-detail";
import {
  cancelCommunicationAction,
  loadCommunicationQuickViewAction,
  sendCommunicationAction,
  type CommunicationQuickView,
} from "../_actions";
import type { CommunicationRow } from "@/lib/mappers/communication.mapper";

const TABS = [
  { key: "message", label: "Message" },
  { key: "delivery", label: "Delivery" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SECONDARY_BUTTON =
  "flex h-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-50";

/**
 * One broadcast — what it said, who it reached — without leaving the history.
 *
 * Send-now and cancel work here too, under the same confirmation the list
 * uses: a broadcast cannot be recalled, so the extra click stays.
 */
export function ViewCommunicationDialog({
  communication: row,
  onClose,
}: {
  communication: CommunicationRow;
  onClose: () => void;
}) {
  const [view, setView] = useState<CommunicationQuickView | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("message");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<"send" | "cancel" | null>(null);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    loadCommunicationQuickViewAction(row.id, page).then((result) => {
      if (!active) return;
      if (result.ok) {
        setView(result.data);
        setError("");
      } else {
        setError(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, [row.id, page, version]);

  const communication = view?.communication ?? row;
  const canSend = view?.canSend ?? false;
  const sendable =
    canSend && (communication.status === "draft" || communication.status === "scheduled");
  const cancellable = canSend && communication.isCancellable;

  return (
    <DetailDialog
      label="View communication"
      onClose={onClose}
      className="max-w-4xl"
      header={
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-3 break-words text-base font-semibold text-foreground">
            {communication.title}
            <Badge meta={communicationStatusMeta[communication.status]} />
          </h2>
          <span className="break-words text-xs text-text-muted">
            {communication.channelLabel} to {communication.audienceLabel.toLowerCase()}
          </span>
        </div>
      }
      footer={
        <>
          {cancellable && (
            <button
              type="button"
              onClick={() => setPending("cancel")}
              className="flex h-11 items-center rounded-lg border border-status-critical/30 px-4 text-sm font-medium text-status-critical transition duration-150 hover:bg-status-critical/10"
            >
              Cancel it
            </button>
          )}
          {sendable && (
            <button type="button" onClick={() => setPending("send")} className={SECONDARY_BUTTON}>
              Send now
            </button>
          )}
          <Link
            href={`/dashboard/communications/history/${communication.id}`}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Open full page
          </Link>
        </>
      }
    >
      {error && (
        <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
          {error}
        </p>
      )}

      <CommunicationStats
        communication={communication}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      />

      <DialogTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "message" && <CommunicationMessage communication={communication} />}

      {tab === "delivery" &&
        (!view ? (
          <p className="py-10 text-center text-sm text-text-muted">Loading recipients…</p>
        ) : (
          <div className="flex flex-col gap-3">
            <CommunicationRecipientsTable rows={view.recipients} />

            {/* Paged in place: the list's Pagination writes to the URL, which
                would page the list behind the dialog instead. */}
            {view.pagination.last_page > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-text-muted">
                  {view.pagination.from}–{view.pagination.to} of{" "}
                  {view.pagination.total.toLocaleString()}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => current - 1)}
                    disabled={view.pagination.current_page <= 1}
                    className={SECONDARY_BUTTON}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={view.pagination.current_page >= view.pagination.last_page}
                    className={SECONDARY_BUTTON}
                  >
                    Next
                  </button>
                </span>
              </div>
            )}
          </div>
        ))}

      {pending && (
        <ConfirmDialog
          title={pending === "send" ? "Send this now?" : "Cancel this communication?"}
          description={
            pending === "send"
              ? `"${communication.title}" goes out to ${communication.audienceLabel.toLowerCase()} immediately. There is no recalling it.`
              : "It will not be sent. A communication already going out cannot be stopped."
          }
          confirmLabel={pending === "send" ? "Send now" : "Cancel it"}
          danger={pending === "cancel"}
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            const result =
              pending === "send"
                ? await sendCommunicationAction(communication.id)
                : await cancelCommunicationAction(communication.id);

            if (result.ok) {
              setPending(null);
              reload();
            }

            return { ok: result.ok, message: result.message };
          }}
        />
      )}
    </DetailDialog>
  );
}
