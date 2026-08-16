import { apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { ActivityDto } from "../types/api";

export type ActivityListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  admin_id?: number;
  action?: string;
  /** Class basename, e.g. "Vendor", "Order", "User". */
  subject_type?: string;
  subject_id?: number;
  from?: string;
  to?: string;
};

/** GET /admin/activity — requires `audit.view` (super admin and finance only). */
export async function listActivity(query: ActivityListQuery): Promise<Paginated<ActivityDto>> {
  return apiFetchPage<ActivityDto>("/admin/activity", { query });
}

// The action list and its label helper live in lib/types/activity-actions.ts so
// Client Components can import them without pulling in the API client.
export { ACTIVITY_ACTIONS, humaniseAction, type ActivityAction } from "../types/activity-actions";
