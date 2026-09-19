import type { PromoCodeDto } from "../types/api";
import type { PromoCodeScope, PromoCodeType } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

export type PromoCodeRow = {
  id: number;
  code: string;
  description: string | null;
  type: PromoCodeType;
  typeLabel: string;
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  scope: PromoCodeScope;
  scopeLabel: string;
  vendorId: number | null;
  categoryId: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  maxPerCustomer: number | null;
  redemptionCount: number;
  isActive: boolean;
  /** Listed in the public offers feed the apps show. */
  isPublic: boolean;
  /** Active *and* inside its window — what the badge should reflect. */
  isLive: boolean;
  createdAt: Date;
};

export function toPromoCodeRow(dto: PromoCodeDto): PromoCodeRow {
  return {
    id: dto.id,
    code: dto.code,
    description: dto.description,
    type: dto.type,
    typeLabel: dto.type_label,
    value: dto.value,
    maxDiscount: dto.max_discount,
    minOrderAmount: dto.min_order_amount,
    scope: dto.scope,
    scopeLabel: dto.scope_label,
    vendorId: dto.vendor_id,
    categoryId: dto.category_id,
    startsAt: toDate(dto.starts_at),
    endsAt: toDate(dto.ends_at),
    maxRedemptions: dto.max_redemptions,
    maxPerCustomer: dto.max_per_customer,
    redemptionCount: dto.redemption_count,
    isActive: dto.is_active,
    isPublic: dto.is_public,
    isLive: dto.is_live,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

/** What the badge should say, combining `is_active` with the scheduling window. */
export function promoCodeState(row: PromoCodeRow): "live" | "scheduled" | "expired" | "inactive" {
  if (!row.isActive) return "inactive";
  if (row.isLive) return "live";

  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) return "scheduled";
  if (row.endsAt && row.endsAt.getTime() < now) return "expired";
  return "inactive";
}
