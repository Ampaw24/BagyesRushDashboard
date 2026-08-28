import type {
  BannerDto,
  BusinessTypeDto,
  CategoryDto,
  PayoutProviderDto,
  ReviewDto,
} from "../types/api";
import type { BannerLinkType, BannerPlacement, PayoutProviderType } from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

export type CategoryRow = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date | null;
};

export function toCategoryRow(dto: CategoryDto): CategoryRow {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    imageUrl: dto.image_url,
    isActive: dto.is_active,
    displayOrder: dto.display_order,
    createdAt: toDateOrEpoch(dto.created_at),
    updatedAt: toDate(dto.updated_at),
  };
}

export type BusinessTypeRow = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  /** Null when the count was not loaded; drives the "cannot delete" hint. */
  vendorsCount: number | null;
  createdAt: Date;
};

export function toBusinessTypeRow(dto: BusinessTypeDto): BusinessTypeRow {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    isActive: dto.is_active,
    displayOrder: dto.display_order,
    vendorsCount: dto.vendors_count ?? null,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

export type BannerRow = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  placement: BannerPlacement;
  placementLabel: string;
  displayOrder: number;
  linkType: BannerLinkType;
  linkTypeLabel: string;
  linkValue: string | null;
  isActive: boolean;
  /** Active *and* inside its window — what the badge should reflect. */
  isLive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
};

export function toBannerRow(dto: BannerDto): BannerRow {
  return {
    id: dto.id,
    title: dto.title,
    subtitle: dto.subtitle,
    description: dto.description,
    imageUrl: dto.image_url,
    placement: dto.placement,
    placementLabel: dto.placement_label,
    displayOrder: dto.display_order,
    linkType: dto.link.type,
    linkTypeLabel: dto.link.type_label,
    linkValue: dto.link.value,
    isActive: dto.is_active,
    isLive: dto.is_live,
    startsAt: toDate(dto.starts_at),
    endsAt: toDate(dto.ends_at),
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

/** Why a banner is not showing, for the status badge. */
export function bannerState(row: BannerRow): "live" | "scheduled" | "expired" | "inactive" {
  if (!row.isActive) return "inactive";
  if (row.isLive) return "live";

  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) return "scheduled";
  if (row.endsAt && row.endsAt.getTime() < now) return "expired";
  return "inactive";
}

export type ReviewRow = {
  id: number;
  rating: number;
  comment: string | null;
  /** Anonymised by the API to "First L." — the full surname is never sent. */
  authorName: string;
  authorAvatarUrl: string | null;
  vendorId: number | null;
  vendorName: string | null;
  orderId: number | null;
  orderNumber: string | null;
  replyBody: string | null;
  replyAt: Date | null;
  isVisible: boolean;
  createdAt: Date;
};

export function toReviewRow(dto: ReviewDto): ReviewRow {
  return {
    id: dto.id,
    rating: dto.rating,
    comment: dto.comment,
    authorName: dto.author?.name ?? "Customer",
    authorAvatarUrl: dto.author?.avatar_url ?? null,
    vendorId: dto.vendor?.id ?? null,
    vendorName: dto.vendor?.name ?? null,
    orderId: dto.order?.id ?? null,
    orderNumber: dto.order?.order_number ?? null,
    replyBody: dto.reply?.body ?? null,
    replyAt: toDate(dto.reply?.replied_at),
    isVisible: dto.is_visible,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}

/** A bank or mobile-money network money can be sent to. */
export type PayoutProviderRow = {
  id: number;
  type: PayoutProviderType;
  name: string;
  shortName: string | null;
  slug: string;
  code: string | null;
  logoUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  /** What a delete would affect. Zero on the public read, which omits both. */
  vendorCount: number;
  riderCount: number;
  createdAt: Date;
};

export function toPayoutProviderRow(dto: PayoutProviderDto): PayoutProviderRow {
  return {
    id: dto.id,
    type: dto.type,
    name: dto.name,
    shortName: dto.short_name,
    slug: dto.slug,
    code: dto.code,
    logoUrl: dto.logo_url,
    isActive: dto.is_active,
    displayOrder: dto.display_order,
    vendorCount: dto.vendor_count ?? 0,
    riderCount: dto.rider_count ?? 0,
    createdAt: toDateOrEpoch(dto.created_at),
  };
}
