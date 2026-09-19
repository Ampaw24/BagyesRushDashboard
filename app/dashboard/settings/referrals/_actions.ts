"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  cancelReferral,
  createReferralMilestone,
  deleteReferralMilestone,
  updateReferralMilestone,
  type SaveReferralMilestoneInput,
} from "@/lib/services/referrals.service";

const ROUTE = "/dashboard/settings/referrals";

/**
 * Refer-and-earn rules.
 *
 * The per-referral amount and the referee bonus are not here: they are money
 * rules published with commission, so they are set on the platform settings
 * screen and versioned with everything else the platform pays. Only the
 * milestone bonuses are rows.
 */

export async function saveMilestoneAction(id: number | null, input: SaveReferralMilestoneInput) {
  return apiAction(id === null ? "Milestone created" : "Milestone updated", async () => {
    if (id === null) await createReferralMilestone(input);
    else await updateReferralMilestone(id, input);

    revalidatePath(ROUTE);
  });
}

export async function deleteMilestoneAction(id: number) {
  // 422 once anybody has been paid it — the award rows point at it, and
  // deleting would leave credits on the ledger with nothing explaining them.
  return apiAction("Milestone deleted", async () => {
    await deleteReferralMilestone(id);
    revalidatePath(ROUTE);
  });
}

export async function cancelReferralAction(id: number) {
  return apiAction("Referral cancelled", async () => {
    await cancelReferral(id);
    revalidatePath(ROUTE);
  });
}
