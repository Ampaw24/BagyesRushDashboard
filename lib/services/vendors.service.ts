import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type {
  MenuItemDto,
  VendorCredentialsDto,
  VendorDto,
  VendorPayoutDto,
} from "../types/api";
import type { VendorStatus } from "../types/enums";

export type VendorListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  city?: string;
  business_type_id?: number;
  status?: VendorStatus;
  is_active?: boolean;
  with_trashed?: boolean;
};

/**
 * GET /admin/vendors — requires `vendors.view`.
 * Ordered pending_review first, then newest, server-side.
 */
export async function listVendors(query: VendorListQuery): Promise<Paginated<VendorDto>> {
  return apiFetchPage<VendorDto>("/admin/vendors", { query });
}

export async function getVendor(id: number): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}`);
}

export type CreateVendorInput = {
  email: string;
  phone: string;
  password?: string;
  business_name: string;
  business_type_id: number;
  contact_person_name: string;
  business_address: string;
  city: string;
  description?: string;
  /** Category NAMES, not ids — the ActiveCategoryName rule validates against `name`. */
  categories?: string[];
  cuisine_types?: string[];
  latitude?: number;
  longitude?: number;
  delivery_fee?: number;
  min_order?: number;
  delivery_radius_km?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  estimated_prep_time_minutes?: number;
  promo_text?: string;
};

/**
 * Requires `vendors.create`. Returns the generated password alongside the
 * vendor — it is shown once and is not retrievable afterwards.
 */
export async function createVendor(input: CreateVendorInput): Promise<VendorCredentialsDto> {
  return apiFetch<VendorCredentialsDto>("/admin/vendors", { method: "POST", body: input });
}

export type UpdateVendorInput = Partial<Omit<CreateVendorInput, "email" | "phone" | "password">> & {
  tax_identification_number?: string;
};

/** Requires `vendors.update`. */
export async function updateVendor(id: number, input: UpdateVendorInput): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}`, { method: "PUT", body: input });
}

export async function updateVendorHours(
  id: number,
  input: {
    opening_time: string;
    closing_time: string;
    operating_days: string[];
    estimated_prep_time_minutes?: number;
  },
): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/hours`, { method: "PUT", body: input });
}

export async function toggleVendorOpen(id: number): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/toggle-open`, { method: "PATCH" });
}

/* Moderation — all require `vendors.moderate`. */

export async function approveVendor(id: number): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/approve`, { method: "PATCH" });
}

/** `reason` must be 10–255 characters. */
export async function rejectVendor(id: number, reason: string): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/reject`, { method: "PATCH", body: { reason } });
}

/** `reason` must be 10–255 characters. */
export async function suspendVendor(id: number, reason: string): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/suspend`, { method: "PATCH", body: { reason } });
}

export async function reinstateVendor(id: number): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/reinstate`, { method: "PATCH" });
}

/** Only an approved vendor may be featured; anything else is a 422. */
export async function toggleVendorFeatured(id: number): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/toggle-featured`, { method: "PATCH" });
}

/* Soft delete — requires `vendors.delete`. Refused while orders are in progress. */

export async function deleteVendor(id: number): Promise<null> {
  return apiFetch<null>(`/admin/vendors/${id}`, { method: "DELETE" });
}

export async function restoreVendor(id: number): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/restore`, { method: "PATCH" });
}

/** Requires `vendors.payout`. Every read is written to the audit log. */
export async function getVendorPayout(id: number): Promise<VendorPayoutDto> {
  return apiFetch<VendorPayoutDto>(`/admin/vendors/${id}/payout`);
}

/** The three images a vendor presents itself with, as the API names them. */
export type VendorImageType = "logo" | "cover" | "banner";

/**
 * POST /admin/vendors/{id}/images/{type} — requires `vendors.update`.
 *
 * POST, not PUT: multipart bodies do not survive PUT in most clients, which is
 * why the backend exposes every upload this way.
 *
 * Note `banner` is what the API calls the square storefront image — the wide
 * one across the top of a storefront is `cover`. The dashboard keeps its own
 * labels ("Storefront image", "Cover image"), which read correctly to an admin;
 * this is the one place the two vocabularies meet.
 */
export async function uploadVendorImage(
  id: number,
  type: VendorImageType,
  form: FormData,
): Promise<VendorDto> {
  return apiFetch<VendorDto>(`/admin/vendors/${id}/images/${type}`, {
    method: "POST",
    formData: form,
  });
}

/** Requires `vendors.view` + `menu.view`. Includes items from unapproved vendors. */
export async function listVendorMenuItems(
  id: number,
  query: { page?: number; per_page?: number; search?: string; category_id?: number; is_available?: boolean },
): Promise<Paginated<MenuItemDto>> {
  return apiFetchPage<MenuItemDto>(`/admin/vendors/${id}/menu-items`, { query });
}

/** Requires `menu.update`. */
export async function toggleMenuItemAvailability(
  vendorId: number,
  itemId: number,
): Promise<MenuItemDto> {
  return apiFetch<MenuItemDto>(`/admin/vendors/${vendorId}/menu-items/${itemId}/toggle-availability`, {
    method: "PATCH",
  });
}

// Reference data for the vendor forms now lives with the resources it belongs
// to: `listActiveBusinessTypes` in business-types.service and
// `listActiveCategories` in categories.service.
