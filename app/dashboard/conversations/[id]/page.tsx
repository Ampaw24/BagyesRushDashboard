import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { ConversationThread } from "./_components/conversation-thread";
import { toConversationRow, toMessageRow } from "@/lib/mappers/conversation.mapper";
import {
  getConversation,
  listConversationMessages,
} from "@/lib/services/conversations.service";
import { isNotFound } from "@/lib/api/errors";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Conversation — BagyesRUSH",
};

export default async function ConversationPage(props: PageProps<"/dashboard/conversations/[id]">) {
  const permissions = await getPermissions();

  if (!can(permissions, "chat.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Conversation" description="Customer and rider chat on one delivery." />
        <NoPermissionState what="delivery conversations" />
      </div>
    );
  }

  const { id } = await props.params;
  const conversationId = Number(id);

  if (!Number.isFinite(conversationId)) notFound();

  let conversation;
  let messages;

  try {
    [conversation, messages] = await Promise.all([
      getConversation(conversationId),
      listConversationMessages(conversationId, { per_page: 100 }),
    ]);
  } catch (error) {
    // Admin services throw ValidationException for a missing record, so a 404
    // here is really a 422 with `errors.conversation`.
    if (isNotFound(error, "conversation")) notFound();
    throw error;
  }

  return (
    <ConversationThread
      conversation={toConversationRow(conversation)}
      // Newest-first off the wire; a transcript reads oldest-first.
      messages={messages.items.map(toMessageRow).reverse()}
      canReply={can(permissions, "chat.join")}
    />
  );
}
