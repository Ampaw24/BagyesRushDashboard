"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DetailDialog } from "../../_components/detail-dialog";
import { Badge } from "../../_components/status-badge";
import { RecordExportButton } from "../../_components/record-export-button";
import { conversationStatusMeta, orderStatusMeta } from "../../_lib/status";
import { conversationRecord } from "@/lib/export/records";
import { OrderQuickViewLink } from "../../orders/_components/order-quick-view-link";
import { useConversationThread } from "./use-conversation-thread";
import { ConversationParticipants, ConversationTranscript } from "./conversation-panel";
import { loadConversationQuickViewAction, type ConversationQuickView } from "../_actions";

const SECONDARY_BUTTON =
  "flex h-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60";

/**
 * A delivery conversation, read and answered in place.
 *
 * Handovers are worked down the conversations list — "has anybody picked this
 * up" — and opening each thread as its own page lost the filters every time.
 * Replying, closing and reopening all work here, and the thread polls exactly
 * as the full page does.
 */
export function ViewConversationDialog({
  conversationId,
  onClose,
}: {
  conversationId: number;
  onClose: () => void;
}) {
  const [view, setView] = useState<ConversationQuickView | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    loadConversationQuickViewAction(conversationId).then((result) => {
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
  }, [conversationId, version]);

  if (!view) {
    return (
      <DetailDialog
        label="View conversation"
        onClose={onClose}
        header={
          <h2 className="text-base font-semibold text-foreground">Thread #{conversationId}</h2>
        }
      >
        {error ? (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {error}
          </p>
        ) : (
          <p className="py-10 text-center text-sm text-text-muted">Loading conversation…</p>
        )}
      </DetailDialog>
    );
  }

  return <LoadedConversationDialog view={view} onModerated={reload} onClose={onClose} />;
}

function LoadedConversationDialog({
  view,
  onModerated,
  onClose,
}: {
  view: ConversationQuickView;
  onModerated: () => void;
  onClose: () => void;
}) {
  const { conversation, canReply } = view;
  const thread = useConversationThread({
    conversation,
    initialMessages: view.messages,
    onModerated,
  });

  return (
    <DetailDialog
      label="View conversation"
      onClose={onClose}
      className="max-w-4xl"
      header={
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-3 break-words text-base font-semibold text-foreground">
            {conversation.order?.orderNumber ?? `Thread #${conversation.id}`}
            <Badge meta={conversationStatusMeta[conversation.status]} />
            {conversation.order?.status && (
              <Badge meta={orderStatusMeta[conversation.order.status]} />
            )}
          </h2>
          <span className="break-words text-xs text-text-muted">
            {conversation.order?.vendorName
              ? `${conversation.topicLabel} · ${conversation.order.vendorName}`
              : conversation.topicLabel}
          </span>
        </div>
      }
      footer={
        <>
          <RecordExportButton
            build={() => conversationRecord(conversation, thread.messages)}
            disabled={thread.messages.length === 0}
            label="Export chat"
          />
          {conversation.order?.id && (
            <OrderQuickViewLink
              orderId={conversation.order.id}
              orderNumber={conversation.order.orderNumber ?? undefined}
              className={SECONDARY_BUTTON}
            >
              View order
            </OrderQuickViewLink>
          )}
          {canReply && (
            <button
              type="button"
              onClick={thread.toggleOpen}
              disabled={thread.moderating}
              className={SECONDARY_BUTTON}
            >
              {conversation.isOpen ? "Close thread" : "Reopen thread"}
            </button>
          )}
          <Link
            href={`/dashboard/conversations/${conversation.id}`}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            Open full page
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_15rem]">
        <ConversationTranscript
          conversation={conversation}
          messages={thread.messages}
          canReply={canReply}
          body={thread.body}
          onBodyChange={thread.setBody}
          sending={thread.sending}
          onSend={thread.send}
        />
        <ConversationParticipants conversation={conversation} />
      </div>
    </DetailDialog>
  );
}
