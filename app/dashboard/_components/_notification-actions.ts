"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications.service";
import type { NotificationDto } from "@/lib/types/api";

/**
 * The bell in the header.
 *
 * Read through Server Actions rather than a client fetch because the bearer
 * token lives in an httpOnly cookie the browser cannot read — the same reason
 * every other call in this dashboard goes through the server.
 */
export async function fetchNotificationsAction() {
  return apiAction<{ items: NotificationDto[]; unread: number }>("", async () => {
    const [page, count] = await Promise.all([
      listNotifications({ per_page: 15 }),
      getUnreadCount(),
    ]);

    return { items: page.items, unread: count.unread };
  });
}

export async function markNotificationReadAction(id: string) {
  return apiAction("", async () => {
    await markNotificationRead(id);
    // The badge is rendered by the layout, so the whole shell has to redraw.
    revalidatePath("/dashboard", "layout");
  });
}

export async function markAllNotificationsReadAction() {
  return apiAction("All caught up", async () => {
    await markAllNotificationsRead();
    revalidatePath("/dashboard", "layout");
  });
}
