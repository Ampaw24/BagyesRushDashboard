import { listActivity } from "@/lib/services/activity.service";
import { toActivityRow, type ActivityRow } from "@/lib/mappers/activity.mapper";

/** How many entries an order shows; the full trail is in the audit log. */
const HISTORY_LIMIT = 25;

/**
 * What staff have done to one order, newest first.
 *
 * Status changes, refunds, rider assignment and delivery resolutions are
 * recorded against the order. Support replies and closing the thread are
 * recorded against the conversation - but to somebody reading an order's
 * history they are things that happened to the order, so the two are merged.
 *
 * Shared by the order page and the quick-view dialog so the two cannot show
 * different histories of the same order. Requires `audit.view`; callers check.
 */
export async function loadOrderHistory(
  orderId: number,
  conversationId: number | null,
): Promise<ActivityRow[]> {
  const query = { changes_only: true, per_page: HISTORY_LIMIT };

  const pages = await Promise.all([
    listActivity({ ...query, subject_type: "Order", subject_id: orderId }),
    conversationId !== null
      ? listActivity({ ...query, subject_type: "Conversation", subject_id: conversationId })
      : null,
  ]);

  return pages
    .flatMap((page) => page?.items.map(toActivityRow) ?? [])
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, HISTORY_LIMIT);
}
