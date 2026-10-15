"use client";

import { PageHeader } from "../../../_components/page-header";
import { Badge } from "../../../_components/status-badge";
import { conversationStatusMeta, orderStatusMeta } from "../../../_lib/status";
import { RecordExportButton } from "../../../_components/record-export-button";
import { conversationRecord } from "@/lib/export/records";
import { OrderQuickViewLink } from "../../../orders/_components/order-quick-view-link";
import { useConversationThread } from "../../_components/use-conversation-thread";
import {
  ConversationParticipants,
  ConversationTranscript,
} from "../../_components/conversation-panel";
import type { ConversationRow, MessageRow } from "@/lib/mappers/conversation.mapper";

/**
 * One delivery conversation, end to end, as a full page.
 *
 * The thread itself — polling, replying, closing — is `useConversationThread`,
 * shared with the quick-view dialog the conversations list opens.
 */
export function ConversationThread({
  conversation,
  messages: initialMessages,
  canReply,
}: {
  conversation: ConversationRow;
  messages: MessageRow[];
  canReply: boolean;
}) {
  const thread = useConversationThread({ conversation, initialMessages });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {conversation.order?.orderNumber ?? `Thread #${conversation.id}`}
            <Badge meta={conversationStatusMeta[conversation.status]} />
            {conversation.order?.status && <Badge meta={orderStatusMeta[conversation.order.status]} />}
          </span>
        }
        description={
          conversation.order?.vendorName
            ? `${conversation.topicLabel} · ${conversation.order.vendorName}`
            : conversation.topicLabel
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* `build`, not a fixed record: the thread polls while it is open,
                so exporting has to read the messages as they stand now rather
                than as they were when the page loaded. */}
            <RecordExportButton
              build={() => conversationRecord(conversation, thread.messages)}
              disabled={thread.messages.length === 0}
              label="Export chat"
            />
            {conversation.order?.id && (
              <OrderQuickViewLink
                orderId={conversation.order.id}
                orderNumber={conversation.order.orderNumber ?? undefined}
                className="flex h-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
              >
                View order
              </OrderQuickViewLink>
            )}
            {canReply && (
              <button
                type="button"
                onClick={thread.toggleOpen}
                disabled={thread.moderating}
                className="flex h-11 items-center rounded-lg border border-border-subtle px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60"
              >
                {conversation.isOpen ? "Close thread" : "Reopen thread"}
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
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
    </div>
  );
}
