import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { CategoryDto } from "../types/api";

export type CategoryListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
};

/**
 * Category management. Every route requires `catalogue.manage`.
 *
 * Unlike the public `/v1/categories` feed, this listing includes inactive
 * records. Ordering is fixed server-side: display_order, then name.
 */
export async function listCategories(query: CategoryListQuery): Promise<Paginated<CategoryDto>> {
  return apiFetchPage<CategoryDto>("/admin/categories", { query });
}

export async function getCategory(id: number): Promise<CategoryDto> {
  return apiFetch<CategoryDto>(`/admin/categories/${id}`);
}

/**
 * Create and update both take multipart, because they accept an image.
 *
 * The update route is `POST /{id}`, NOT `PUT` — multipart bodies do not survive
 * PUT in most clients, so the backend deliberately exposes it as a POST.
 */
export async function createCategory(form: FormData): Promise<CategoryDto> {
  return apiFetch<CategoryDto>("/admin/categories", { method: "POST", formData: form });
}

export async function updateCategory(id: number, form: FormData): Promise<CategoryDto> {
  return apiFetch<CategoryDto>(`/admin/categories/${id}`, { method: "POST", formData: form });
}

/** Refused with a 422 while menu items or vendors still reference the category. */
export async function deleteCategory(id: number): Promise<null> {
  return apiFetch<null>(`/admin/categories/${id}`, { method: "DELETE" });
}

export async function toggleCategoryStatus(id: number): Promise<CategoryDto> {
  return apiFetch<CategoryDto>(`/admin/categories/${id}/toggle-status`, { method: "PATCH" });
}

/** Active categories only, for the pickers on the vendor and banner forms. */
export async function listActiveCategories(): Promise<Paginated<CategoryDto>> {
  return apiFetchPage<CategoryDto>("/admin/categories", {
    query: { is_active: true, per_page: 100 },
  });
}
