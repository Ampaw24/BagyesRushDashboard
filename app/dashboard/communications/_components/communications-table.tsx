"use client";

import Link from "next/link";
import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { Badge } from "../../_components/status-badge";
import { ActionMenu, type ActionMenuItem } from "../../_components/action-menu";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { EmptyState } from "../../_components/empty-state";
import { Pagination } from "../../_components/pagination";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { communicationStatusMeta } from "../../_lib/status";
import { formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import { cancelCommunicationAction, sendCommunicationAction } from "../_actions";
import type { CommunicationRow } from "@/lib/mappers/communication.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_STATUSES,
  COMMUNICATION_STATUS_LABELS,
} from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "All statuses",
  options: COMMUNICATION_STATUSES.map((status) => ({
    value: status,
    label: COMMUNICATION_STATUS_LABELS[status],
  })),
};

const CHANNEL_FILTER: SelectFilter = {
  key: "channel",
  label: "Channel",
  allLabel: "All channels",
  options: COMMUNICATION_CHANNELS.map((channel) => ({
    value: channel,
    label: COMMUNICATION_CHANNEL_LABELS[channel],
  })),
};

type PendingAction = { kind: "send" | "cancel"; communication: CommunicationRow };

export function CommunicationsTable({
  communications,
  pagination,
  canSend,
  showFilters = true,
  emptyDescription = "Nothing has been sent yet.",
}: {
  communications: CommunicationRow[];
  pagination: PaginationMeta;
  canSend: boolean;
  showFilters?: boolean;
  emptyDescription?: string;
}) {
  const [pending, setPending] = useState<PendingAction | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {showFilters && (
        <FilterBar
          searchPlaceholder="Search title or message"
          filters={[STATUS_FILTER, CHANNEL_FILTER]}
        />
      )}

      {communications.length === 0 ? (
        <EmptyState title="No communications" description={emptyDescription} />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Message</TableHeadCell>
              <TableHeadCell>Audience</TableHeadCell>
              <TableHeadCell>Channel</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Delivered</TableHeadCell>
              <TableHeadCell>When</TableHeadCell>
              <TableHeadCell>{""}</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {communications.map((communication) => {
              const actions: ActionMenuItem[] = [];

              if (
                canSend &&
                (communication.status === "draft" || communication.status === "scheduled")
              ) {
                actions.push({
                  label: "Send now",
                  onClick: () => setPending({ kind: "send", communication }),
                });
              }

              if (canSend && communication.isCancellable) {
                actions.push({
                  label: "Cancel",
                  danger: true,
                  onClick: () => setPending({ kind: "cancel", communication }),
                });
              }

              return (
                <tr key={communication.id} className="transition duration-150 hover:bg-surface-muted">
                  <TableCell>
                    <Link
                      href={`/dashboard/communications/history/${communication.id}`}
                      className="flex flex-col gap-0.5"
                    >
                      <span className="font-medium text-foreground">{communication.title}</span>
                      <span className="line-clamp-1 text-xs text-text-muted">
                        {communication.body}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">{communication.audienceLabel}</span>
                    {communication.audience === "custom" && (
                      <span className="block text-xs text-text-muted">
                        {communication.selectedUserCount} selected
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">{communication.channelLabel}</span>
                  </TableCell>
                  <TableCell>
                    <Badge meta={communicationStatusMeta[communication.status]} />
                  </TableCell>
                  <TableCell>
                    {communication.recipients === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className="flex flex-col gap-0.5">
                        <span className="tabular-nums text-foreground">
                          {communication.sent.toLocaleString()} /{" "}
                          {communication.recipients.toLocaleString()}
                        </span>
                        {communication.failed > 0 && (
                          <span className="text-xs text-status-critical">
                            {communication.failed.toLocaleString()} failed
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">
                      {communication.status === "scheduled"
                        ? formatDateTimeOrDash(communication.scheduledAt)
                        : formatDateTime(communication.completedAt ?? communication.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {actions.length > 0 && <ActionMenu items={actions} />}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <Pagination pagination={pagination} />

      {pending && (
        <ConfirmDialog
          title={pending.kind === "send" ? "Send this now?" : "Cancel this communication?"}
          description={
            pending.kind === "send"
              ? `"${pending.communication.title}" goes out to ${pending.communication.audienceLabel.toLowerCase()} immediately. There is no recalling it.`
              : // Once a worker has started, some of those people have already
                // been reached — which is why the backend refuses it at that
                // point rather than pretending.
                "It will not be sent. A communication already going out cannot be stopped."
          }
          confirmLabel={pending.kind === "send" ? "Send now" : "Cancel it"}
          danger={pending.kind === "cancel"}
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            const result =
              pending.kind === "send"
                ? await sendCommunicationAction(pending.communication.id)
                : await cancelCommunicationAction(pending.communication.id);

            if (result.ok) setPending(null);

            return { ok: result.ok, message: result.message };
          }}
        />
      )}
    </div>
  );
}
