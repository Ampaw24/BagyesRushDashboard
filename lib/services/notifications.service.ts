import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { NotificationDto } from "../types/api";

/**
 * The signed-in admin's own notification feed.
 *
 * Not an admin-specific endpoint: `/v1/notifications` is the same surface the
 * customer, vendor and rider apps read, behind `auth:sanctum` and scoped to
 * whoever is holding the token. One feed, one set of rules about read state.
 */
export async function listNotifications(
  query: { page?: number; per_page?: number; unread?: boolean } = {},
): Promise<Paginated<NotificationDto>> {
  return apiFetchPage<NotificationDto>("/notifications", { query });
}

export async function getUnreadCount(): Promise<{ unread: number }> {
  return apiFetch<{ unread: number }>("/notifications/unread-count");
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<unknown>(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<unknown>("/notifications/read-all", { method: "PATCH" });
}
