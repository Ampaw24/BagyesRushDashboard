"use server";

import { revalidatePath } from "next/cache";

import { apiAction } from "@/lib/api/action";
import {
  createPromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
  updatePromoCode,
  type SavePromoCodeInput,
  listPromoCodeRedemptions,
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

/**
 * Who redeemed a code.
 *
 * Read through an action rather than the page because it is opened from a row
 * menu, not navigated to — the list would otherwise have to fetch every code's
 * redemptions up front to show one dialog.
 */
export async function loadRedemptionsAction(id: number) {
  return apiAction("Redemptions loaded", async () => {
    const page = await listPromoCodeRedemptions(id, { per_page: 100 });

    return {
      total: page.pagination.total,
      items: page.items.map((dto) => ({
        id: dto.id,
        discount: dto.discount,
        customerName: dto.customer?.name ?? "Deleted customer",
        orderNumber: dto.order?.order_number ?? null,
        orderTotal: dto.order?.total ?? null,
        redeemedAt: dto.redeemed_at,
      })),
    };
  });
}
