"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  createPayoutProvider,
  deletePayoutProvider,
  togglePayoutProviderStatus,
  updatePayoutProvider,
  type PayoutProviderInput,
} from "@/lib/services/payout-providers.service";
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
  createVehicleType,
  deleteVehicleType,
  toggleVehicleTypeStatus,
  updateVehicleType,
  type SaveVehicleTypeInput,
} from "@/lib/services/vehicle-types.service";
import {
  createVehicleMake,
  deleteVehicleMake,
  toggleVehicleMakeStatus,
  updateVehicleMake,
  type CreateVehicleMakeInput,
  type UpdateVehicleMakeInput,
} from "@/lib/services/vehicle-makes.service";
import {
  createVehicleModel,
  deleteVehicleModel,
  toggleVehicleModelStatus,
  updateVehicleModel,
  type CreateVehicleModelInput,
  type UpdateVehicleModelInput,
} from "@/lib/services/vehicle-models.service";
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

/* ---------------------------------------------------------------- Providers */

/**
 * Banks and mobile-money networks.
 *
 * Deleting is refused by the API while any vendor or rider is paid through the
 * provider - deactivating is the right move there, and the message says so.
 */
export async function savePayoutProviderAction(
  id: number | null,
  // FormData when a logo is being uploaded, a plain object otherwise. Sending
  // multipart for a rename would be wasteful, and the API accepts both.
  input: PayoutProviderInput | FormData,
) {
  return apiAction(id ? "Provider updated" : "Provider created", async () => {
    if (id) {
      await updatePayoutProvider(id, input);
    } else {
      await createPayoutProvider(input);
    }

    revalidatePath("/dashboard/catalogue/payout-providers");
  });
}

export async function togglePayoutProviderStatusAction(id: number) {
  return apiAction("Provider updated", async () => {
    await togglePayoutProviderStatus(id);
    revalidatePath("/dashboard/catalogue/payout-providers");
  });
}

export async function deletePayoutProviderAction(id: number) {
  return apiAction("Provider deleted", async () => {
    await deletePayoutProvider(id);
    revalidatePath("/dashboard/catalogue/payout-providers");
  });
}

/* -------------------------------------------------------------------------- */
/* Vehicles — types, makes, models                                            */
/* -------------------------------------------------------------------------- */

/**
 * The fleet. Editing this is not cosmetic: `is_active` on a type decides who
 * can register as a rider, and `max_parcel_size` decides which parcel sizes
 * customers are offered. Deleting is refused while riders or child rows still
 * reference the row, and the API's message names what is in the way.
 */

export async function saveVehicleTypeAction(id: number | null, input: SaveVehicleTypeInput) {
  return apiAction(id === null ? "Vehicle type created" : "Vehicle type updated", async () => {
    if (id === null) await createVehicleType(input);
    else await updateVehicleType(id, input);

    revalidatePath("/dashboard/catalogue/vehicle-types");
  });
}

export async function deleteVehicleTypeAction(id: number) {
  return apiAction("Vehicle type deleted", async () => {
    await deleteVehicleType(id);
    revalidatePath("/dashboard/catalogue/vehicle-types");
  });
}

export async function toggleVehicleTypeStatusAction(id: number) {
  return apiAction("Vehicle type status updated", async () => {
    await toggleVehicleTypeStatus(id);
    // Makes and models of a deactivated type leave the public API with it, so
    // both of those listings can change too.
    revalidatePath("/dashboard/catalogue/vehicle-types");
    revalidatePath("/dashboard/catalogue/vehicle-makes");
    revalidatePath("/dashboard/catalogue/vehicle-models");
  });
}

export async function saveVehicleMakeAction(
  id: number | null,
  input: CreateVehicleMakeInput | UpdateVehicleMakeInput,
) {
  return apiAction(id === null ? "Vehicle make created" : "Vehicle make updated", async () => {
    // A make cannot change type — that would re-file every rider on it — so an
    // edit sends the name and flags only.
    if (id === null) await createVehicleMake(input as CreateVehicleMakeInput);
    else await updateVehicleMake(id, input as UpdateVehicleMakeInput);

    revalidatePath("/dashboard/catalogue/vehicle-makes");
  });
}

export async function deleteVehicleMakeAction(id: number) {
  return apiAction("Vehicle make deleted", async () => {
    await deleteVehicleMake(id);
    revalidatePath("/dashboard/catalogue/vehicle-makes");
  });
}

export async function toggleVehicleMakeStatusAction(id: number) {
  return apiAction("Vehicle make status updated", async () => {
    await toggleVehicleMakeStatus(id);
    revalidatePath("/dashboard/catalogue/vehicle-makes");
    revalidatePath("/dashboard/catalogue/vehicle-models");
  });
}

export async function saveVehicleModelAction(
  id: number | null,
  input: CreateVehicleModelInput | UpdateVehicleModelInput,
) {
  return apiAction(id === null ? "Vehicle model created" : "Vehicle model updated", async () => {
    if (id === null) await createVehicleModel(input as CreateVehicleModelInput);
    else await updateVehicleModel(id, input as UpdateVehicleModelInput);

    revalidatePath("/dashboard/catalogue/vehicle-models");
  });
}

export async function deleteVehicleModelAction(id: number) {
  return apiAction("Vehicle model deleted", async () => {
    await deleteVehicleModel(id);
    revalidatePath("/dashboard/catalogue/vehicle-models");
  });
}

export async function toggleVehicleModelStatusAction(id: number) {
  return apiAction("Vehicle model status updated", async () => {
    await toggleVehicleModelStatus(id);
    revalidatePath("/dashboard/catalogue/vehicle-models");
  });
}
