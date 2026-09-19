import type { MenuItemDto, VendorDto, VendorPayoutDto } from "../types/api";
import {
  VENDOR_DOCUMENT_TYPES,
  type MobileMoneyProvider,
  type UserStatus,
  type VendorDocumentType,
  type VendorStatus,
} from "../types/enums";
import { toDate, toDateOrEpoch } from "./dates";

/**
 * The dashboard used to model a vendor with a five-value status
 * (active/pending/suspended/inactive/archived) plus a separate
 * `verificationStatus`. The backend has none of that: it has `status`,
 * an `is_active` flag, a soft-delete, and a `documents_status`. This view model
 * follows the backend, and `derivedState` recreates the labels the sidebar
 * sub-pages need from those real fields.
 */
export type VendorDerivedState = "pending" | "active" | "inactive" | "suspended" | "rejected";

export type VendorRow = {
  id: number;
  /** Public-facing reference, e.g. "VND-0001". */
  vendorId: string;
  slug: string;
  businessName: string;
  contactPersonName: string;
  city: string;
  /** From the business_type relation; null when it was not eager-loaded. */
  businessType: string | null;
  businessTypeId: number;
  categories: string[];
  status: VendorStatus;
  statusLabel: string;
  derivedState: VendorDerivedState;
  isActive: boolean;
  isFeatured: boolean;
  /** The vendor's own switch. Intent, not effect. */
  isOpen: boolean;
  /** The switch AND the schedule agreeing. What customers actually see. */
  isOpenNow: boolean;
  closedReason: "switched_off" | "closed_today" | "outside_hours" | null;
  isProfileComplete: boolean;
  documentsStatus: string | null;
  documentsUploaded: number;
  documentsTotal: number;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  minOrder: number;
  logoUrl: string | null;
  /**
   * The owner's user id, which is what the direct-message endpoint takes — a
   * vendor id is not a user id. Null when the response did not carry the
   * account block, in which case messaging is not offered rather than guessed.
   */
  userId: number | null;
  email: string | null;
  phone: string | null;
  accountStatus: UserStatus | null;
  joinedAt: Date;
};

export type VendorDetail = VendorRow & {
  description: string | null;
  businessAddress: string;
  address: string | null;
  taxIdentificationNumber: string | null;
  coverImageUrl: string | null;
  /** The square storefront shot, distinct from the wide cover. */
  imageUrl: string | null;
  cuisineTypes: string[];
  openingTime: string | null;
  closingTime: string | null;
  operatingDays: string[];
  estimatedPrepTimeMinutes: number | null;
  deliveryRadiusKm: number | null;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  promoText: string | null;
  latitude: number | null;
  longitude: number | null;
  rejectionReason: string | null;
  missingProfileFields: string[];
  documents: { type: VendorDocumentType; uploaded: boolean }[];
  documentsReviewedAt: Date | null;
  payoutConfigured: boolean;
  payoutMasked: {
    bankName: string | null;
    accountName: string | null;
    accountNumberLast4: string | null;
    mobileMoneyProvider: MobileMoneyProvider | null;
    mobileMoneyNumberLast4: string | null;
  };
  updatedAt: Date | null;
};

/**
 * Collapses `status` + `is_active` into the single label the vendor sub-pages
 * are organised around. An approved vendor that has switched itself off is
 * "inactive", which is why /vendors/active filters on both fields.
 */
export function deriveVendorState(dto: VendorDto): VendorDerivedState {
  if (dto.status === "pending_review") return "pending";
  if (dto.status === "rejected") return "rejected";
  if (dto.status === "suspended") return "suspended";
  return dto.is_active ? "active" : "inactive";
}

export function toVendorRow(dto: VendorDto): VendorRow {
  const uploaded = VENDOR_DOCUMENT_TYPES.filter((type) => dto.documents[type]?.uploaded).length;

  return {
    id: dto.id,
    vendorId: dto.vendor_id,
    slug: dto.slug,
    businessName: dto.business_name,
    contactPersonName: dto.contact_person_name,
    city: dto.city,
    businessType: dto.business_type?.name ?? null,
    businessTypeId: dto.business_type_id,
    categories: dto.categories ?? [],
    status: dto.status,
    statusLabel: dto.status_label,
    derivedState: deriveVendorState(dto),
    isActive: dto.is_active,
    isFeatured: dto.is_featured,
    isOpen: dto.is_open,
    isOpenNow: dto.is_open_now,
    closedReason: dto.closed_reason ?? null,
    isProfileComplete: dto.is_profile_complete,
    documentsStatus: dto.documents_status,
    documentsUploaded: uploaded,
    documentsTotal: VENDOR_DOCUMENT_TYPES.length,
    rating: dto.rating,
    reviewCount: dto.review_count,
    deliveryFee: dto.delivery_fee,
    minOrder: dto.min_order,
    logoUrl: dto.logo_url,
    userId: dto.account?.id ?? null,
    email: dto.account?.email ?? null,
    // Was hardcoded null: the resource carried no account block at all, so an
    // admin could read a vendor's bank details and not their phone number.
    phone: dto.account?.phone ?? null,
    accountStatus: dto.account?.status ?? null,
    joinedAt: toDateOrEpoch(dto.created_at),
  };
}

export function toVendorDetail(dto: VendorDto): VendorDetail {
  return {
    ...toVendorRow(dto),
    description: dto.description,
    businessAddress: dto.business_address,
    address: dto.address,
    taxIdentificationNumber: dto.tax_identification_number,
    coverImageUrl: dto.cover_image_url,
    imageUrl: dto.image_url,
    cuisineTypes: dto.cuisine_types ?? [],
    openingTime: dto.opening_time,
    closingTime: dto.closing_time,
    operatingDays: dto.operating_days ?? [],
    estimatedPrepTimeMinutes: dto.estimated_prep_time_minutes,
    deliveryRadiusKm: dto.delivery_radius_km,
    deliveryTimeMin: dto.delivery_time_min,
    deliveryTimeMax: dto.delivery_time_max,
    promoText: dto.promo_text,
    latitude: dto.latitude,
    longitude: dto.longitude,
    rejectionReason: dto.rejection_reason,
    missingProfileFields: dto.missing_profile_fields,
    documents: VENDOR_DOCUMENT_TYPES.map((type) => ({
      type,
      uploaded: dto.documents[type]?.uploaded ?? false,
    })),
    documentsReviewedAt: toDate(dto.documents_reviewed_at),
    payoutConfigured: dto.payout.is_configured,
    payoutMasked: {
      bankName: dto.payout.bank_name,
      accountName: dto.payout.account_name,
      accountNumberLast4: dto.payout.account_number_last4,
      mobileMoneyProvider: dto.payout.mobile_money_provider,
      mobileMoneyNumberLast4: dto.payout.mobile_money_number_last4,
    },
    updatedAt: toDate(dto.updated_at),
  };
}

/** Full payout details, from the separately-permissioned endpoint. */
export type VendorPayout = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  branchCode: string | null;
  mobileMoneyProvider: MobileMoneyProvider | null;
  mobileMoneyNumber: string | null;
};

export function toVendorPayout(dto: VendorPayoutDto): VendorPayout {
  return {
    bankName: dto.bank_name,
    accountName: dto.account_name,
    accountNumber: dto.account_number,
    branchCode: dto.branch_code,
    mobileMoneyProvider: dto.mobile_money_provider,
    mobileMoneyNumber: dto.mobile_money_number,
  };
}

export type MenuItemRow = {
  id: number;
  vendorId: number;
  name: string;
  description: string | null;
  price: number;
  categoryName: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  displayOrder: number;
};

export function toMenuItemRow(dto: MenuItemDto): MenuItemRow {
  return {
    id: dto.id,
    vendorId: dto.vendor_id,
    name: dto.name,
    description: dto.description,
    price: dto.price,
    categoryName: dto.category?.name ?? null,
    imageUrl: dto.image_url,
    isAvailable: dto.is_available,
    isPopular: dto.is_popular,
    isFeatured: dto.is_featured,
    displayOrder: dto.display_order,
  };
}
