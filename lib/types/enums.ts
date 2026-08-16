/**
 * Mirrors of app/Enums/ and the role/status constants on App\Models\User.
 *
 * Labels are copied from the backend enums so the dashboard and the API agree
 * on wording. Where a resource already ships a `*_label`, prefer that value —
 * these maps exist for the places that only receive the raw enum (filters,
 * dropdowns, badges).
 */

export const ORDER_STATUSES = [
  "pending_payment",
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  pending: "Awaiting vendor",
  accepted: "Accepted",
  preparing: "Being prepared",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
  refunded: "Refunded",
};

export const VENDOR_STATUSES = ["pending_review", "approved", "rejected", "suspended"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const vendorStatusLabels: Record<VendorStatus, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

/** From VendorStatus::transitions() — the UI must never offer an illegal move. */
export const vendorStatusTransitions: Record<VendorStatus, VendorStatus[]> = {
  pending_review: ["approved", "rejected"],
  rejected: ["pending_review", "approved"],
  approved: ["suspended"],
  suspended: ["approved"],
};

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_METHODS = ["card", "mobile_money", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: "Card",
  mobile_money: "Mobile money",
  cash: "Cash on delivery",
};

export const USER_ROLES = ["customer", "vendor", "admin", "delivery"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const userStatusLabels: Record<UserStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

/**
 * Staff roles. These replace the dashboard's former super_admin/admin/
 * support_staff triple — the backend's AssignRoleRequest accepts nothing else.
 */
export const ADMIN_ROLES = ["super_admin", "manager", "support", "finance"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "Super administrator",
  manager: "Manager",
  support: "Support",
  finance: "Finance",
};

export const PROMO_CODE_TYPES = ["percentage", "fixed", "free_delivery"] as const;
export type PromoCodeType = (typeof PROMO_CODE_TYPES)[number];

export const promoCodeTypeLabels: Record<PromoCodeType, string> = {
  percentage: "Percentage",
  fixed: "Fixed amount",
  free_delivery: "Free delivery",
};

export const PROMO_CODE_SCOPES = ["platform", "vendor", "category"] as const;
export type PromoCodeScope = (typeof PROMO_CODE_SCOPES)[number];

export const promoCodeScopeLabels: Record<PromoCodeScope, string> = {
  platform: "Platform-wide",
  vendor: "Single vendor",
  category: "Category",
};

export const BANNER_PLACEMENTS = ["home", "vendors", "categories", "checkout"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const bannerPlacementLabels: Record<BannerPlacement, string> = {
  home: "Home",
  vendors: "Vendors",
  categories: "Categories",
  checkout: "Checkout",
};

export const BANNER_LINK_TYPES = ["none", "vendor", "category", "url"] as const;
export type BannerLinkType = (typeof BANNER_LINK_TYPES)[number];

export const bannerLinkTypeLabels: Record<BannerLinkType, string> = {
  none: "No link",
  vendor: "Vendor",
  category: "Category",
  url: "External URL",
};

/**
 * What each link type expects in `link_value`, mirrored from the backend's
 * ValidatesBannerLink trait so the form can explain itself before submitting.
 */
export const bannerLinkValueHints: Record<BannerLinkType, string> = {
  none: "Leave the link value empty.",
  vendor: "An approved vendor's slug, vendor ID or numeric ID.",
  category: "The numeric ID of an active category.",
  url: "A full http:// or https:// URL.",
};

export const MOBILE_MONEY_PROVIDERS = ["mtn", "vodafone", "airteltigo"] as const;
export type MobileMoneyProvider = (typeof MOBILE_MONEY_PROVIDERS)[number];

/** Vendor::IMAGE_TYPES and Vendor::DOCUMENT_TYPES. */
export const VENDOR_IMAGE_TYPES = ["logo", "cover", "banner"] as const;
export type VendorImageType = (typeof VENDOR_IMAGE_TYPES)[number];

export const VENDOR_DOCUMENT_TYPES = [
  "business_registration_certificate",
  "food_safety_license",
  "owner_id",
] as const;
export type VendorDocumentType = (typeof VENDOR_DOCUMENT_TYPES)[number];

export const vendorDocumentLabels: Record<VendorDocumentType, string> = {
  business_registration_certificate: "Business registration certificate",
  food_safety_license: "Food safety license",
  owner_id: "Owner ID",
};

/**
 * app/Enums/Permission.php. `GET /admin/me` returns the subset the signed-in
 * admin holds; the dashboard gates navigation and actions on it so nothing
 * that would 403 is ever offered.
 */
export const PERMISSIONS = [
  "dashboard.view",
  "vendors.view",
  "vendors.create",
  "vendors.update",
  "vendors.moderate",
  "vendors.delete",
  "vendors.documents",
  "vendors.payout",
  "menu.view",
  "menu.update",
  "orders.view",
  "orders.update_status",
  "orders.assign_rider",
  "payments.view",
  "payments.refund",
  "payments.verify",
  "customers.view",
  "customers.suspend",
  "users.view",
  "users.manage",
  "users.assign_role",
  "reviews.view",
  "reviews.moderate",
  "catalogue.manage",
  "promos.manage",
  "audit.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Currency is fixed to GHS by config('marketplace.currency'). */
export const CURRENCY = "GHS";
