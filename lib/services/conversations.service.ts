import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  AdminConversationDto,
  AdminMessageDto,
  AdminMessagesPageDto,
  ConversationStatsDto,
} from "../types/api";
import type { ConversationStatus } from "../types/enums";

/**
 * The customer-and-rider chat on every delivery.
 *
 * The app-facing `/v1/conversations` is authorised by membership alone, which
 * is right for the two people doing the delivery and leaves staff unable to
 * read the one record a disputed delivery turns on. `/admin/conversations` is
 * the deliberate counterpart, behind `chat.view`; replying needs `chat.join`
 * on top, because speaking puts a visible support seat in the thread.
 */

export type ConversationListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: ConversationStatus;
  order_id?: number;
  /** Threads staff have already stepped into, or only those they have not. */
  has_admin?: boolean;
};

export async function listConversations(
  query: ConversationListQuery,
): Promise<Paginated<AdminConversationDto>> {
  return apiFetchPage<AdminConversationDto>("/admin/conversations", { query });
}

export async function getConversationStats(): Promise<ConversationStatsDto> {
  return apiFetch<ConversationStatsDto>("/admin/conversations/stats");
}

export async function getConversation(id: number): Promise<AdminConversationDto> {
  return apiFetch<AdminConversationDto>(`/admin/conversations/${id}`);
}

/**
 * Cursor-paginated rather than offset: a thread grows at the end while it is
 * being read, so there is no stable page count to report.
 */
export async function listConversationMessages(
  id: number,
  query: { per_page?: number; cursor?: string } = {},
): Promise<AdminMessagesPageDto> {
  return apiFetch<AdminMessagesPageDto>(`/admin/conversations/${id}/messages`, { query });
}

/**
 * Reply as support. Takes a seat in the thread, which both sides then see —
 * the backend posts a one-off system line the first time it happens.
 */
export async function replyToConversation(id: number, body: string): Promise<AdminMessageDto> {
  return apiFetch<AdminMessageDto>(`/admin/conversations/${id}/messages`, {
    method: "POST",
    body: { body },
  });
}

export async function closeConversation(id: number): Promise<AdminConversationDto> {
  return apiFetch<AdminConversationDto>(`/admin/conversations/${id}/close`, { method: "POST" });
}

export async function reopenConversation(id: number): Promise<AdminConversationDto> {
  return apiFetch<AdminConversationDto>(`/admin/conversations/${id}/reopen`, { method: "POST" });
}

/**
 * The thread on one order, or null when nobody has opened one.
 *
 * Deliberately does not create a conversation the way the customer-facing route
 * does: an admin reading an order must not be what makes a chat window appear
 * on somebody's phone.
 */
export async function getConversationForOrder(
  orderId: number,
): Promise<AdminConversationDto | null> {
  return apiFetch<AdminConversationDto | null>(`/admin/conversations/for-order/${orderId}`);
}
