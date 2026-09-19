"use server";

import { apiAction } from "@/lib/api/action";
import { messageUser } from "@/lib/services/communications.service";
import type { CommunicationChannel } from "@/lib/types/enums";

/**
 * Actions shared across more than one section of the dashboard.
 *
 * Everything else lives in the `_actions.ts` of the route that owns it. This
 * file is for the handful that genuinely belong to no single screen — messaging
 * one person is reachable from customers, vendors and riders alike.
 */

export type DirectMessageInput = {
  channel: CommunicationChannel;
  title: string;
  body: string;
  sms_body?: string | null;
};

/**
 * POST /admin/users/{id}/message — requires `communications.send`.
 *
 * The id is a **user** id, not a customer, vendor or rider id. It goes through
 * the same machinery a broadcast does, so a one-off reply to a vendor lands in
 * the same history as everything else sent: "did anybody get back to them" has
 * one place to look rather than two.
 *
 * No `revalidatePath` — nothing on the page the admin is looking at changes.
 */
export async function messageUserAction(userId: number, input: DirectMessageInput) {
  return apiAction("Message queued for delivery", async () => {
    await messageUser(userId, input);
  });
}
