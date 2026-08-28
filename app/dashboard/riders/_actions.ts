"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  createRider,
  deleteRider,
  moderateRider,
  restoreRider,
  type CreateRiderInput,
} from "@/lib/services/riders.service";

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
