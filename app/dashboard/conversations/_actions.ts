"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import { toMessageRow } from "@/lib/mappers/conversation.mapper";
import {
  closeConversation,
  listConversationMessages,
  reopenConversation,
  replyToConversation,
} from "@/lib/services/conversations.service";

/**
 * Reply as support.
 *
 * Takes a seat in the thread, which both sides then see — that is deliberate on
 * the backend, and the reason reading a conversation does not join it.
 */
export async function replyToConversationAction(id: number, body: string) {
  return apiAction("Message sent", async () => toMessageRow(await replyToConversation(id, body)));
}

/**
 * Re-read the thread.
 *
 * Called on a short timer while a conversation is open, because the dashboard
 * does not hold a socket on it: an admin watching a live argument needs the next
 * line to appear without a page reload.
 */
export async function loadConversationMessagesAction(id: number) {
  return apiAction("Messages retrieved", async () => {
    const page = await listConversationMessages(id, { per_page: 100 });
    // Newest-first off the wire; a transcript reads oldest-first.
    return page.items.map(toMessageRow).reverse();
  });
}

export async function closeConversationAction(id: number) {
  return apiAction("Conversation closed", async () => {
    await closeConversation(id);
    revalidatePath(`/dashboard/conversations/${id}`);
    revalidatePath("/dashboard/conversations");
  });
}

export async function reopenConversationAction(id: number) {
  return apiAction("Conversation reopened", async () => {
    await reopenConversation(id);
    revalidatePath(`/dashboard/conversations/${id}`);
    revalidatePath("/dashboard/conversations");
  });
}
