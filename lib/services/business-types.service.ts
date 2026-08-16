import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { BusinessTypeDto } from "../types/api";

export type BusinessTypeListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
};

/**
 * Business type management. Every route requires `catalogue.manage`.
 *
 * The admin listing adds `vendors_count`, which is what makes the delete rule
 * legible: a type that vendors are registered under cannot be removed.
 */
export async function listBusinessTypes(
  query: BusinessTypeListQuery,
): Promise<Paginated<BusinessTypeDto>> {
  return apiFetchPage<BusinessTypeDto>("/admin/business-types", { query });
}

export async function getBusinessType(id: number): Promise<BusinessTypeDto> {
  return apiFetch<BusinessTypeDto>(`/admin/business-types/${id}`);
}

export type SaveBusinessTypeInput = {
  name: string;
  description?: string | null;
  is_active?: boolean;
  display_order?: number;
};

export async function createBusinessType(input: SaveBusinessTypeInput): Promise<BusinessTypeDto> {
  return apiFetch<BusinessTypeDto>("/admin/business-types", { method: "POST", body: input });
}

/** PUT here — unlike categories and banners, this endpoint takes no image. */
export async function updateBusinessType(
  id: number,
  input: SaveBusinessTypeInput,
): Promise<BusinessTypeDto> {
  return apiFetch<BusinessTypeDto>(`/admin/business-types/${id}`, { method: "PUT", body: input });
}

/** 422: "Cannot delete a business type that vendors are registered under." */
export async function deleteBusinessType(id: number): Promise<null> {
  return apiFetch<null>(`/admin/business-types/${id}`, { method: "DELETE" });
}

export async function toggleBusinessTypeStatus(id: number): Promise<BusinessTypeDto> {
  return apiFetch<BusinessTypeDto>(`/admin/business-types/${id}/toggle-status`, { method: "PATCH" });
}

/** Active types only, for the picker on the vendor create form. */
export async function listActiveBusinessTypes(): Promise<Paginated<BusinessTypeDto>> {
  return apiFetchPage<BusinessTypeDto>("/admin/business-types", {
    query: { is_active: true, per_page: 100 },
  });
}
