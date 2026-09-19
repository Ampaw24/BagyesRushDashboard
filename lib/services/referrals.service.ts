import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { ReferralDto, ReferralMilestoneDto, ReferralSummaryDto } from "../types/api";

/**
 * Refer and earn.
 *
 * All of this is `settings.manage`, not `promos.manage`: the rates are money
 * the platform pays out, versioned alongside commission, rather than a discount
 * on what it charges. The per-referral amount and the referee bonus live in
 * platform settings; only the milestone bonuses are rows.
 */

export type ReferralListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: "pending" | "qualified" | "cancelled";
  referrer_id?: number;
};

export async function listReferrals(query: ReferralListQuery): Promise<Paginated<ReferralDto>> {
  return apiFetchPage<ReferralDto>("/admin/referrals", { query });
}

export async function getReferralSummary(): Promise<ReferralSummaryDto> {
  return apiFetch<ReferralSummaryDto>("/admin/referrals/summary");
}

/** Close a pending referral without paying it. A qualified one is refused. */
export async function cancelReferral(id: number): Promise<ReferralDto> {
  return apiFetch<ReferralDto>(`/admin/referrals/${id}/cancel`, { method: "PATCH" });
}

export async function listReferralMilestones(): Promise<ReferralMilestoneDto[]> {
  return apiFetch<ReferralMilestoneDto[]>("/admin/referrals/milestones");
}

export type SaveReferralMilestoneInput = {
  referrals_required?: number;
  /** Decimal major units, like every other money field an admin types. */
  reward?: number;
  description?: string | null;
  is_active?: boolean;
};

export async function createReferralMilestone(
  input: SaveReferralMilestoneInput,
): Promise<ReferralMilestoneDto> {
  return apiFetch<ReferralMilestoneDto>("/admin/referrals/milestones", { method: "POST", body: input });
}

export async function updateReferralMilestone(
  id: number,
  input: SaveReferralMilestoneInput,
): Promise<ReferralMilestoneDto> {
  return apiFetch<ReferralMilestoneDto>(`/admin/referrals/milestones/${id}`, { method: "PUT", body: input });
}

export async function deleteReferralMilestone(id: number): Promise<null> {
  return apiFetch<null>(`/admin/referrals/milestones/${id}`, { method: "DELETE" });
}
