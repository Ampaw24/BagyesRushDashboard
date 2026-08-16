"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  createPromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
  updatePromoCode,
  type SavePromoCodeInput,
} from "@/lib/services/promo-codes.service";

/**
 * Promo code CRUD. Every route here needs `promos.manage` — the backend has no
 * read-only tier for promo codes.
 */

export async function savePromoCodeAction(id: number | null, input: SavePromoCodeInput) {
  return apiAction(id === null ? "Promo code created" : "Promo code updated", async () => {
    if (id === null) await createPromoCode(input);
    else await updatePromoCode(id, input);

    revalidatePath("/dashboard/coupons");
  });
}

export async function deletePromoCodeAction(id: number) {
  return apiAction("Promo code deleted", async () => {
    await deletePromoCode(id);
    revalidatePath("/dashboard/coupons");
  });
}

export async function togglePromoCodeStatusAction(id: number) {
  return apiAction("Promo code status updated", async () => {
    await togglePromoCodeStatus(id);
    revalidatePath("/dashboard/coupons");
  });
}
