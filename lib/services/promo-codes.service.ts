import { apiFetch, apiFetchPage } from "../api/client";
import type { Paginated } from "../api/types";
import type { PromoCodeDto, PromoCodeRedemptionDto } from "../types/api";
import type { PromoCodeScope, PromoCodeType } from "../types/enums";

export type PromoCodeListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  scope?: PromoCodeScope;
  is_active?: boolean;
};

/** All promo-code routes require `promos.manage` — there is no read-only tier. */
export async function listPromoCodes(query: PromoCodeListQuery): Promise<Paginated<PromoCodeDto>> {
  return apiFetchPage<PromoCodeDto>("/admin/promo-codes", { query });
}

export async function getPromoCode(id: number): Promise<PromoCodeDto> {
  return apiFetch<PromoCodeDto>(`/admin/promo-codes/${id}`);
}

/**
 * Body for both create and update. The backend also enforces cross-field rules:
 * a percentage code needs a value of 1–100, a fixed code a value above zero, a
 * vendor-scoped code a `vendor_id`, and a category-scoped code a `category_id`.
 */
export type SavePromoCodeInput = {
  code: string;
  description?: string | null;
  type: PromoCodeType;
  /**
   * `value` and `min_order_amount` are NOT NULL columns with a database default
   * of 0, even though the FormRequest marks them `nullable`. Sending an explicit
   * null is a 500, so these are omit-when-blank rather than null-when-blank.
   * The genuinely nullable fields below still accept null to clear them.
   */
  value?: number;
  max_discount?: number | null;
  min_order_amount?: number;
  scope?: PromoCodeScope;
  vendor_id?: number | null;
  category_id?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  max_redemptions?: number | null;
  max_per_customer?: number | null;
  is_active?: boolean;
  /**
   * List this code in the public offers feed the apps show. False by default:
   * a code handed to specific customers is targeted, not an advertisement.
   */
  is_public?: boolean;
};

export async function createPromoCode(input: SavePromoCodeInput): Promise<PromoCodeDto> {
  return apiFetch<PromoCodeDto>("/admin/promo-codes", { method: "POST", body: input });
}

/** PUT here, unlike categories and banners, which take a multipart POST. */
export async function updatePromoCode(
  id: number,
  input: SavePromoCodeInput,
): Promise<PromoCodeDto> {
  return apiFetch<PromoCodeDto>(`/admin/promo-codes/${id}`, { method: "PUT", body: input });
}

export async function deletePromoCode(id: number): Promise<null> {
  return apiFetch<null>(`/admin/promo-codes/${id}`, { method: "DELETE" });
}

export async function togglePromoCodeStatus(id: number): Promise<PromoCodeDto> {
  return apiFetch<PromoCodeDto>(`/admin/promo-codes/${id}/toggle-status`, { method: "PATCH" });
}

/**
 * Who redeemed this code, on which order, for how much.
 *
 * `redemption_count` on the code says a campaign was used and nothing about
 * whether it worked or who worked it.
 */
export async function listPromoCodeRedemptions(
  id: number,
  query: { page?: number; per_page?: number } = {},
): Promise<Paginated<PromoCodeRedemptionDto>> {
  return apiFetchPage<PromoCodeRedemptionDto>(`/admin/promo-codes/${id}/redemptions`, { query });
}
