"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  approveVendor,
  createVendor,
  deleteVendor,
  reinstateVendor,
  rejectVendor,
  restoreVendor,
  suspendVendor,
  toggleMenuItemAvailability,
  toggleVendorFeatured,
  toggleVendorOpen,
  type CreateVendorInput,
} from "@/lib/services/vendors.service";

/**
 * Vendor moderation and lifecycle.
 *
 * Every list route is revalidated because the vendor sub-pages are all filtered
 * views of the same collection — approving a vendor moves it between several of
 * them at once.
 */
function revalidateVendorViews(id?: number) {
  revalidatePath("/dashboard/vendors");
  revalidatePath("/dashboard/vendors/all");
  revalidatePath("/dashboard/vendors/pending");
  revalidatePath("/dashboard/vendors/active");
  revalidatePath("/dashboard/vendors/inactive");
  revalidatePath("/dashboard/vendors/suspended");
  revalidatePath("/dashboard/vendors/applications");
  if (id !== undefined) revalidatePath(`/dashboard/vendors/${id}`);
}

export async function approveVendorAction(id: number) {
  return apiAction("Vendor approved", async () => {
    await approveVendor(id);
    revalidateVendorViews(id);
  });
}

/** `reason` must be 10–255 characters — ModerateVendorRequest enforces it. */
export async function rejectVendorAction(id: number, reason: string) {
  return apiAction("Vendor rejected", async () => {
    await rejectVendor(id, reason);
    revalidateVendorViews(id);
  });
}

/** `reason` must be 10–255 characters. */
export async function suspendVendorAction(id: number, reason: string) {
  return apiAction("Vendor suspended", async () => {
    await suspendVendor(id, reason);
    revalidateVendorViews(id);
  });
}

export async function reinstateVendorAction(id: number) {
  return apiAction("Vendor reinstated", async () => {
    await reinstateVendor(id);
    revalidateVendorViews(id);
  });
}

/** Only an approved vendor can be featured; anything else is a 422. */
export async function toggleVendorFeaturedAction(id: number) {
  return apiAction("Featured status updated", async () => {
    await toggleVendorFeatured(id);
    revalidateVendorViews(id);
  });
}

export async function toggleVendorOpenAction(id: number) {
  return apiAction("Vendor open state updated", async () => {
    await toggleVendorOpen(id);
    revalidateVendorViews(id);
  });
}

/** Soft delete. Refused with a 422 while the vendor has orders in progress. */
export async function deleteVendorAction(id: number) {
  return apiAction("Vendor deleted", async () => {
    await deleteVendor(id);
    revalidateVendorViews(id);
  });
}

export async function restoreVendorAction(id: number) {
  return apiAction("Vendor restored", async () => {
    await restoreVendor(id);
    revalidateVendorViews(id);
  });
}

export async function toggleMenuItemAvailabilityAction(vendorId: number, itemId: number) {
  return apiAction("Availability updated", async () => {
    await toggleMenuItemAvailability(vendorId, itemId);
    revalidatePath(`/dashboard/vendors/${vendorId}`);
  });
}

/**
 * Creates the vendor and its login in one call. The generated password comes
 * back once and is never retrievable again, so it is returned to the caller to
 * display rather than being dropped.
 */
export async function createVendorAction(input: CreateVendorInput) {
  return apiAction("Vendor created", async () => {
    const created = await createVendor(input);
    revalidateVendorViews();
    return { id: created.vendor.id, password: created.password };
  });
}
