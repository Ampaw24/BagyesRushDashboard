"use client";

import Link from "next/link";

import { TableCell, TableHeadCell, TableShell } from "../_components/table-shell";
import { Badge } from "../_components/status-badge";
import { EmptyState } from "../_components/empty-state";
import { Pagination } from "../_components/pagination";
import { FilterBar, type SelectFilter } from "../_components/filter-bar";
import { conversationStatusMeta, orderStatusMeta } from "../_lib/status";
import { formatDateTimeOrDash, formatRelative } from "../_lib/format";
import type { ConversationRow } from "@/lib/mappers/conversation.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { CONVERSATION_STATUSES, conversationStatusLabels } from "@/lib/types/enums";

const STATUS_FILTER: SelectFilter = {
  key: "status",
  label: "Status",
  allLabel: "Open and closed",
  options: CONVERSATION_STATUSES.map((status) => ({
    value: status,
    label: conversationStatusLabels[status],
  })),
};

/**
 * "Has anybody picked this up" is the first question on a handover, so it is a
 * filter rather than something to read off thirty rows.
 */
const SUPPORT_FILTER: SelectFilter = {
  key: "has_admin",
  label: "Staff",
  allLabel: "All threads",
  options: [
    { value: "0", label: "Nobody has joined" },
    { value: "1", label: "Staff have joined" },
  ],
};

export function ConversationsTable({
  conversations,
  pagination,
}: {
  conversations: ConversationRow[];
  pagination: PaginationMeta;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchPlaceholder="Search order number, phone or email"
        filters={[STATUS_FILTER, SUPPORT_FILTER]}
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations match your filters"
          description="A thread only exists once a rider has picked up an order and somebody has opened the chat."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Customer</TableHeadCell>
                <TableHeadCell>Rider</TableHeadCell>
                <TableHeadCell>Order status</TableHeadCell>
                <TableHeadCell>Thread</TableHeadCell>
                <TableHeadCell>Staff</TableHeadCell>
                <TableHeadCell>Messages</TableHeadCell>
                <TableHeadCell>Last message</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/conversations/${conversation.id}`}
                      className="break-words hover:text-brand"
                    >
                      {conversation.order?.orderNumber ?? `Thread #${conversation.id}`}
                    </Link>
                    {conversation.order?.vendorName && (
                      <span className="mt-0.5 block text-xs font-normal text-text-muted">
                        {conversation.order.vendorName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    <Party name={conversation.customer?.name} phone={conversation.customer?.phone} />
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    <Party name={conversation.rider?.name} phone={conversation.rider?.phone} />
                  </TableCell>
                  <TableCell>
                    {conversation.order?.status ? (
                      <Badge meta={orderStatusMeta[conversation.order.status]} />
                    ) : (
                      <span className="text-sm text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge meta={conversationStatusMeta[conversation.status]} />
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {conversation.hasSupport ? "Joined" : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {conversation.messageCount ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {conversation.lastMessageAt ? (
                      <span title={formatDateTimeOrDash(conversation.lastMessageAt)}>
                        {formatRelative(conversation.lastMessageAt)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}
    </div>
  );
}

function Party({ name, phone }: { name?: string | null; phone?: string | null }) {
  if (!name) return <span className="text-text-muted">—</span>;

  return (
    <span className="flex flex-col">
      <span className="break-words">{name}</span>
      {phone && <span className="text-xs text-text-muted">{phone}</span>}
    </span>
  );
}
