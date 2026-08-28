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

/** Riders share the vendor lifecycle — same four states, same graph. */
export const RIDER_STATUSES = ["pending_review", "approved", "rejected", "suspended"] as const;
export type RiderStatus = (typeof RIDER_STATUSES)[number];

export const riderStatusLabels: Record<RiderStatus, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

/** From RiderStatus::allowedTransitions(). */
export const riderStatusTransitions: Record<RiderStatus, RiderStatus[]> = {
  pending_review: ["approved", "rejected"],
  rejected: ["pending_review", "approved"],
  approved: ["suspended"],
  suspended: ["approved"],
};

/**
 * What happened to one job offer.
 *
 * `declined` is the rider saying no; `expired` is them saying nothing, which is
 * the far more common answer and worth telling apart — a rider who never
 * responds is a different problem from one who keeps refusing.
 */
export const DELIVERY_OFFER_STATUSES = [
  "offered",
  "accepted",
  "declined",
  "expired",
  "cancelled",
] as const;
export type DeliveryOfferStatus = (typeof DELIVERY_OFFER_STATUSES)[number];

export const deliveryOfferStatusLabels: Record<DeliveryOfferStatus, string> = {
  offered: "Offered",
  accepted: "Accepted",
  declined: "Declined",
  expired: "No response",
  cancelled: "Taken by another rider",
};

export const IDENTITY_DOCUMENT_TYPES = ["ghana_card", "passport"] as const;
export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number];

export const identityDocumentLabels: Record<IdentityDocumentType, string> = {
  ghana_card: "Ghana Card",
  passport: "Passport",
};

/**
 * Whether the rider owns the machine they ride. A registration document proves
 * a vehicle is registered, not that the person on it may ride it — anyone on
 * someone else's bike also needs written authorisation from the owner.
 */
export const VEHICLE_OWNERSHIPS = ["owned", "authorised"] as const;
export type VehicleOwnership = (typeof VEHICLE_OWNERSHIPS)[number];

export const vehicleOwnershipLabels: Record<VehicleOwnership, string> = {
  owned: "Owned by the rider",
  authorised: "Authorised to use another owner's vehicle",
};

/**
 * Every vehicle the backend can store. Used for filters and badges, because a
 * rider registered under an earlier fleet policy still has to be findable.
 */
export const VEHICLE_TYPES = ["motorbike", "bicycle", "tricycle", "car"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/**
 * What the fleet actually runs today, and therefore what a form may offer.
 *
 * Motorbikes only for now. The backend is the authority - it validates against
 * config('marketplace.riders.vehicle_types') - so widening the fleet there
 * without updating this only makes the dashboard form narrower than the API,
 * never the other way round.
 */
export const SELECTABLE_VEHICLE_TYPES = ["motorbike"] as const;

export const vehicleTypeLabels: Record<VehicleType, string> = {
  motorbike: "Motorbike",
  bicycle: "Bicycle",
  tricycle: "Tricycle",
  car: "Car",
};

/**
 * Every document a rider can hold. Which are *required* varies with the
 * vehicle — a bicycle courier has no licence, insurance or roadworthy
 * certificate — so each entry in the API response carries its own `required`
 * flag rather than being derived here.
 */
export const RIDER_DOCUMENT_TYPES = [
  "ghana_card_front",
  "ghana_card_back",
  "passport_bio_page",
  "drivers_licence_front",
  "drivers_licence_back",
  "rider_permit",
  "vehicle_registration",
  "vehicle_authorisation",
  "insurance_certificate",
  "roadworthy_certificate",
] as const;
export type RiderDocumentType = (typeof RIDER_DOCUMENT_TYPES)[number];

export const riderDocumentLabels: Record<RiderDocumentType, string> = {
  ghana_card_front: "Ghana Card (front)",
  ghana_card_back: "Ghana Card (back)",
  passport_bio_page: "Passport (bio page)",
  drivers_licence_front: "Driver's licence (front)",
  drivers_licence_back: "Driver's licence (back)",
  rider_permit: "Rider permit",
  vehicle_registration: "Vehicle registration",
  vehicle_authorisation: "Authorisation to use the vehicle",
  insurance_certificate: "Insurance certificate",
  roadworthy_certificate: "Roadworthy certificate",
};

/** Credential columns that carry an expiry date, and how to name them. */
export const riderCredentialLabels: Record<string, string> = {
  licence_expires_at: "Driver's licence",
  insurance_expires_at: "Insurance",
  roadworthy_expires_at: "Roadworthy certificate",
  rider_permit_expires_at: "Rider permit",
};

/**
 * Why money moved in or out of a rider's wallet.
 *
 * Only four of these can be posted by hand — the rest are written by the system
 * as a consequence of something happening, and an admin creating one would be
 * recording an event that did not occur.
 */
/** Somewhere money can be sent. One table, two kinds. */
export const PAYOUT_PROVIDER_TYPES = ["bank", "mobile_money"] as const;
export type PayoutProviderType = (typeof PAYOUT_PROVIDER_TYPES)[number];

export const payoutProviderTypeLabels: Record<PayoutProviderType, string> = {
  bank: "Bank",
  mobile_money: "Mobile money",
};

export const WALLET_TRANSACTION_TYPES = [
  "delivery_earning",
  "order_earning",
  "tip",
  "bonus",
  "admin_credit",
  "admin_debit",
  "withdrawal",
  "withdrawal_reversal",
  "adjustment",
] as const;
export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

export const MANUAL_WALLET_TRANSACTION_TYPES = [
  "admin_credit",
  "admin_debit",
  "bonus",
  "adjustment",
] as const;

export const walletTransactionTypeLabels: Record<WalletTransactionType, string> = {
  delivery_earning: "Delivery earning",
  order_earning: "Order earning",
  tip: "Tip",
  bonus: "Bonus",
  admin_credit: "Credit",
  admin_debit: "Debit",
  withdrawal: "Withdrawal",
  withdrawal_reversal: "Withdrawal reversed",
  adjustment: "Adjustment",
};

export const WITHDRAWAL_STATUSES = [
  "pending",
  "approved",
  "paid",
  "rejected",
  "cancelled",
  "reversed",
] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const withdrawalStatusLabels: Record<WithdrawalStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved, awaiting payment",
  paid: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled",
  // Distinct from rejected: a rejection is a decision somebody made before any
  // money moved, a reversal is the bank sending back a settled transfer.
  reversed: "Reversed by the bank",
};

/** From WithdrawalStatus::allowedTransitions(). */
export const withdrawalStatusTransitions: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["paid", "rejected"],
  // Not terminal: a bank can recall a settled transfer hours later.
  paid: ["reversed"],
  rejected: [],
  cancelled: [],
  reversed: [],
};

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/**
 * What a customer can pay with, and therefore what the payments filter offers.
 *
 * Cash on delivery is retired — everything is paid up front. The backend still
 * returns `cash` on orders placed before that, which is why it survives in
 * PaymentMethod and in the label map but not in this list.
 */
export const PAYMENT_METHODS = ["card", "mobile_money"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number] | "cash";

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
  "riders.view",
  "riders.create",
  "riders.update",
  "riders.moderate",
  "riders.delete",
  "riders.documents",
  "riders.payout",
  "riders.wallet",
  "menu.view",
  "menu.update",
  "orders.view",
  "orders.update_status",
  "orders.assign_rider",
  "dispatch.manage",
  "withdrawals.view",
  "withdrawals.process",
  "communications.view",
  "communications.send",
  "reports.view",
  "reports.manage",
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
  "settings.manage",
  "audit.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Currency is fixed to GHS by config('marketplace.currency'). */
export const CURRENCY = "GHS";

// --- Communications ---------------------------------------------------------

/**
 * There is deliberately no email channel. `MAIL_MAILER` is still `log` and
 * nothing on the backend sends mail; offering it here would be a button that
 * silently does nothing.
 */
export const COMMUNICATION_CHANNELS = ["push", "sms", "both"] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  push: "Push notification",
  sms: "SMS",
  both: "Push and SMS",
};

export const COMMUNICATION_AUDIENCES = [
  "all",
  "customers",
  "vendors",
  "riders",
  "admins",
  "custom",
] as const;
export type CommunicationAudience = (typeof COMMUNICATION_AUDIENCES)[number];

export const COMMUNICATION_AUDIENCE_LABELS: Record<CommunicationAudience, string> = {
  all: "Everyone",
  customers: "Customers",
  vendors: "Vendors",
  riders: "Riders",
  admins: "Staff",
  custom: "Selected people",
};

export const COMMUNICATION_STATUSES = [
  "draft",
  "scheduled",
  "queued",
  "sending",
  "sent",
  "partially_failed",
  "failed",
  "cancelled",
] as const;
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  queued: "Queued",
  sending: "Sending",
  sent: "Sent",
  // A send to thousands is almost never wholly one thing or the other.
  partially_failed: "Partially sent",
  failed: "Failed",
  cancelled: "Cancelled",
};

// --- Reports ----------------------------------------------------------------

export const REPORT_STATUSES = ["pending", "in_review", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const REPORT_TARGET_TYPES = [
  "vendor",
  "rider",
  "customer",
  "order_issue",
  "general",
] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  vendor: "Vendor",
  rider: "Rider",
  customer: "Customer",
  order_issue: "Order issue",
  general: "General",
};

// --- Order type -------------------------------------------------------------

/**
 * Food and parcels share the `orders` table — a parcel is an order with no
 * vendor — so both appear on the same board and the type is what tells them
 * apart. The status graph branches on it: a parcel never enters a kitchen.
 */
export const ORDER_TYPES = ["food", "parcel"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  food: "Food",
  parcel: "Parcel",
};

export const PARCEL_SIZES = ["small", "medium", "large", "extra_large"] as const;
export type ParcelSize = (typeof PARCEL_SIZES)[number];

export const PARCEL_SIZE_LABELS: Record<ParcelSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra large",
};

export const PARCEL_STOP_STATUSES = ["pending", "delivered", "failed"] as const;
export type ParcelStopStatus = (typeof PARCEL_STOP_STATUSES)[number];

export const PARCEL_STOP_STATUS_LABELS: Record<ParcelStopStatus, string> = {
  pending: "Not yet delivered",
  delivered: "Delivered",
  // Per stop, not per order: a rider can deliver four of five packages and the
  // fifth recipient not answer the door.
  failed: "Could not deliver",
};
