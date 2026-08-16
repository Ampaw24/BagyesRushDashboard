"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  createCategory,
  deleteCategory,
  toggleCategoryStatus,
  updateCategory,
} from "@/lib/services/categories.service";
import {
  createBusinessType,
  deleteBusinessType,
  toggleBusinessTypeStatus,
  updateBusinessType,
  type SaveBusinessTypeInput,
} from "@/lib/services/business-types.service";
import {
  createBanner,
  deleteBanner,
  toggleBannerStatus,
  updateBanner,
} from "@/lib/services/banners.service";

/**
 * Catalogue mutations — categories, business types and banners.
 *
 * All of these require `catalogue.manage`; the backend enforces it, and the
 * pages hide the controls when the signed-in admin lacks it.
 *
 * The category and banner forms pass a `FormData` straight through, because
 * both accept an image and must go out as multipart. The client never
 * reconstructs the body — whatever the form collected is what gets sent.
 */

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export async function saveCategoryAction(id: number | null, form: FormData) {
  return apiAction(id === null ? "Category created" : "Category updated", async () => {
    // Both create and update are POST; update just carries the id in the path.
    if (id === null) await createCategory(form);
    else await updateCategory(id, form);

    revalidatePath("/dashboard/catalogue/categories");
  });
}

export async function deleteCategoryAction(id: number) {
  // 422 when menu items or vendors still reference it — the API's message says so.
  return apiAction("Category deleted", async () => {
    await deleteCategory(id);
    revalidatePath("/dashboard/catalogue/categories");
  });
}

export async function toggleCategoryStatusAction(id: number) {
  return apiAction("Category status updated", async () => {
    await toggleCategoryStatus(id);
    revalidatePath("/dashboard/catalogue/categories");
  });
}

/* -------------------------------------------------------------------------- */
/* Business types                                                             */
/* -------------------------------------------------------------------------- */

export async function saveBusinessTypeAction(id: number | null, input: SaveBusinessTypeInput) {
  return apiAction(id === null ? "Business type created" : "Business type updated", async () => {
    if (id === null) await createBusinessType(input);
    else await updateBusinessType(id, input);

    revalidatePath("/dashboard/catalogue/business-types");
  });
}

export async function deleteBusinessTypeAction(id: number) {
  return apiAction("Business type deleted", async () => {
    await deleteBusinessType(id);
    revalidatePath("/dashboard/catalogue/business-types");
  });
}

export async function toggleBusinessTypeStatusAction(id: number) {
  return apiAction("Business type status updated", async () => {
    await toggleBusinessTypeStatus(id);
    revalidatePath("/dashboard/catalogue/business-types");
  });
}

/* -------------------------------------------------------------------------- */
/* Banners                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveBannerAction(id: number | null, form: FormData) {
  return apiAction(id === null ? "Banner created" : "Banner updated", async () => {
    if (id === null) await createBanner(form);
    else await updateBanner(id, form);

    revalidatePath("/dashboard/catalogue/banners");
  });
}

export async function deleteBannerAction(id: number) {
  return apiAction("Banner deleted", async () => {
    await deleteBanner(id);
    revalidatePath("/dashboard/catalogue/banners");
  });
}

export async function toggleBannerStatusAction(id: number) {
  return apiAction("Banner status updated", async () => {
    await toggleBannerStatus(id);
    revalidatePath("/dashboard/catalogue/banners");
  });
}
