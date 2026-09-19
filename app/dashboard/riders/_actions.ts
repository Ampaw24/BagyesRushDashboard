"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  createRider,
  deleteRider,
  getRider,
  updateRider,
  moderateRider,
  restoreRider,
  setRiderAvailability,
  type CreateRiderInput,
} from "@/lib/services/riders.service";
import { toRiderDetail } from "@/lib/mappers/rider.mapper";

/**
 * Rider moderation and lifecycle.
 *
 * Every list route is revalidated because the rider sub-pages are all filtered
 * views of the same collection — approving someone moves them between several
 * of them at once.
 */
function revalidateRiderViews(id?: number) {
  revalidatePath("/dashboard/riders");
  revalidatePath("/dashboard/riders/requests");
  revalidatePath("/dashboard/riders/incomplete");
  revalidatePath("/dashboard/riders/blocked");
  revalidatePath("/dashboard/riders/deleted");
  if (id !== undefined) revalidatePath(`/dashboard/riders/${id}`);
}

export async function approveRiderAction(id: number) {
  return apiAction("Rider approved", async () => {
    await moderateRider(id, "approve");
    revalidateRiderViews(id);
  });
}

/** `reason` must be 10–255 characters — ModerateRiderRequest enforces it. */
export async function rejectRiderAction(id: number, reason: string) {
  return apiAction("Rider rejected", async () => {
    await moderateRider(id, "reject", reason);
    revalidateRiderViews(id);
  });
}

/** `reason` must be 10–255 characters. Suspending also takes them offline. */
export async function suspendRiderAction(id: number, reason: string) {
  return apiAction("Rider blocked", async () => {
    await moderateRider(id, "suspend", reason);
    revalidateRiderViews(id);
  });
}

export async function reinstateRiderAction(id: number) {
  return apiAction("Rider reinstated", async () => {
    await moderateRider(id, "reinstate");
    revalidateRiderViews(id);
  });
}

/**
 * Put a rider on or off the dispatch board.
 *
 * Refused while they are carrying something - taking a rider offline
 * mid-delivery would strand the order rather than free them.
 */
export async function setRiderAvailabilityAction(id: number, isOnline: boolean) {
  return apiAction(isOnline ? "Rider is now online" : "Rider is now offline", async () => {
    await setRiderAvailability(id, isOnline);
    revalidateRiderViews(id);
  });
}

/** Refused by the API while the rider still has a delivery in progress. */
export async function deleteRiderAction(id: number) {
  return apiAction("Rider deleted", async () => {
    await deleteRider(id);
    revalidateRiderViews(id);
  });
}

export async function restoreRiderAction(id: number) {
  return apiAction("Rider restored", async () => {
    await restoreRider(id);
    revalidateRiderViews(id);
  });
}

/** The generated password is returned once and never again — surface it. */
export async function createRiderAction(input: CreateRiderInput) {
  return apiAction("Rider created", async () => {
    const created = await createRider(input);
    revalidateRiderViews();

    return { id: created.rider.id, password: created.password };
  });
}

/**
 * Correcting a rider's details — `PUT /admin/riders/{id}`.
 *
 * Status, availability, documents and payout are not reachable from here:
 * `UpdateRiderProfileRequest` does not accept them, `Rider::$fillable` excludes
 * them, and RiderProfileService strips them again. Three independent barriers,
 * and this action is on the safe side of all three.
 */
export async function updateRiderAction(id: number, input: Partial<CreateRiderInput>) {
  return apiAction("Rider updated", async () => {
    await updateRider(id, input);
    revalidateRiderViews(id);
  });
}

/**
 * Loads a rider's full profile for the quick-view dialog.
 *
 * The list response is deliberately thin — it carries no vehicle detail, no
 * compliance dates and no document list — so the dialog fetches on open rather
 * than every row over-fetching for a profile nobody may look at.
 *
 * `riders.view` is the only permission this needs; the dialog hides the
 * document links unless the caller also holds `riders.documents`, and the
 * backend refuses them independently.
 */
export async function loadRiderDetailAction(id: number) {
  return apiAction("Rider retrieved", async () => toRiderDetail(await getRider(id)));
}
