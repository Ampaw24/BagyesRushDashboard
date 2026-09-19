"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  approveVendor,
  createVendor,
  deleteVendor,
  getVendor,
  reinstateVendor,
  rejectVendor,
  restoreVendor,
  suspendVendor,
  toggleMenuItemAvailability,
  toggleVendorFeatured,
  toggleVendorOpen,
  updateVendor,
  uploadVendorImage,
  type CreateVendorInput,
  type VendorImageType,
  type UpdateVendorInput,
} from "@/lib/services/vendors.service";
import { toVendorDetail } from "@/lib/mappers/vendor.mapper";

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

/**
 * Correcting a vendor's operational data — `PUT /admin/vendors/{id}`.
 *
 * Reuses VendorProfileService throughout on the backend, so one implementation
 * of what a profile field means whoever is editing. `business_type_id` is the
 * field that only staff can change, and the reason this exists.
 */
export async function updateVendorAction(id: number, input: UpdateVendorInput) {
  return apiAction("Vendor updated", async () => {
    await updateVendor(id, input);
    revalidateVendorViews(id);
  });
}

/**
 * Loads a vendor's full profile for the quick-view dialog.
 *
 * The list response carries no address, no opening hours, no document list and
 * no storefront imagery, so the dialog fetches on open rather than every row
 * over-fetching for a profile nobody may look at.
 */
export async function loadVendorDetailAction(id: number) {
  return apiAction("Vendor retrieved", async () => toVendorDetail(await getVendor(id)));
}

/**
 * Replace one of a vendor's three images.
 *
 * The gap this closes: an admin could see the logo and the storefront shot and
 * do nothing about either. A vendor who uploads something broken, wrong or
 * unusable left staff with one lever - suspend the whole kitchen - for a
 * problem that is one file replacement.
 *
 * The file is not read here; it goes to the API as multipart and the backend
 * sniffs the real type from the bytes rather than trusting the name.
 */
export async function uploadVendorImageAction(
  id: number,
  type: VendorImageType,
  form: FormData,
) {
  return apiAction("Image updated", async () => {
    await uploadVendorImage(id, type, form);
    revalidateVendorViews(id);
  });
}
