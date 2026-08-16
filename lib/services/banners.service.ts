import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { BannerDto } from "../types/api";
import type { BannerLinkType, BannerPlacement } from "../types/enums";

export type BannerListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  placement?: BannerPlacement;
  link_type?: BannerLinkType;
  is_active?: boolean;
};

/**
 * Banner management. Every route requires `catalogue.manage`.
 *
 * This listing includes inactive and out-of-window banners, which the public
 * feed hides — that is the whole point of the admin view.
 */
export async function listBanners(query: BannerListQuery): Promise<Paginated<BannerDto>> {
  return apiFetchPage<BannerDto>("/admin/banners", { query });
}

export async function getBanner(id: number): Promise<BannerDto> {
  return apiFetch<BannerDto>(`/admin/banners/${id}`);
}

/**
 * Multipart on both create and update — the update route is `POST /{id}`, not
 * `PUT`, for the same reason as categories.
 *
 * The image is REQUIRED on create and optional on update (omitting it keeps the
 * existing one). Max 4 MB, jpeg/png/jpg/webp.
 */
export async function createBanner(form: FormData): Promise<BannerDto> {
  return apiFetch<BannerDto>("/admin/banners", { method: "POST", formData: form });
}

export async function updateBanner(id: number, form: FormData): Promise<BannerDto> {
  return apiFetch<BannerDto>(`/admin/banners/${id}`, { method: "POST", formData: form });
}

export async function deleteBanner(id: number): Promise<null> {
  return apiFetch<null>(`/admin/banners/${id}`, { method: "DELETE" });
}

export async function toggleBannerStatus(id: number): Promise<BannerDto> {
  return apiFetch<BannerDto>(`/admin/banners/${id}/toggle-status`, { method: "PATCH" });
}
