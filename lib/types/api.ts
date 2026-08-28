/**
 * Field-for-field mirrors of the backend's API Resource classes
 * (app/Http/Resources/**). Only what the admin surface actually returns.
 *
 * Two conventions to keep in mind while reading these:
 *   - `whenLoaded` keys are OMITTED, not null, so they are typed optional (`?`).
 *   - Every timestamp is an ISO string from `toISOString()`. The one exception
 *     is `CustomerSummaryDto.last_ordered_at`, a raw DB datetime.
 */

import type {
  AdminRole,
  BannerLinkType,
  BannerPlacement,
  CommunicationAudience,
  CommunicationChannel,
  CommunicationStatus,
  DeliveryOfferStatus,
  IdentityDocumentType,
  MobileMoneyProvider,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PayoutProviderType,
  Permission,
  OrderType,
  ParcelSize,
  ParcelStopStatus,
  PromoCodeScope,
  PromoCodeType,
  ReportStatus,
  ReportTargetType,
  RiderDocumentType,
  RiderStatus,
  UserRole,
  UserStatus,
  VehicleOwnership,
  VehicleType,
  VendorStatus,
  WalletTransactionType,
  WithdrawalStatus,
} from "./enums";

/* -------------------------------------------------------------------------- */
/* Auth & profile                                                             */
/* -------------------------------------------------------------------------- */

/** UserResource — returned by POST /v1/login and GET /v1/profile. */
export type UserDto = {
  id: number;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  phone_verified: boolean;
  phone_verified_at: string | null;
  last_login_at: string | null;
  created_at: string | null;
  profile: unknown | null;
};

export type LoginResponseDto = {
  user: UserDto;
  access_token: string;
  token_type: string;
};

/** GET /admin/me */
export type AdminProfileDto = {
  id: number;
  email: string;
  phone: string;
  status: UserStatus;
  role: AdminRole | null;
  role_label: string | null;
  role_description: string | null;
  is_super_admin: boolean;
  /** Empty for a suspended account — User::hasPermission() short-circuits. */
  permissions: Permission[];
  last_login_at: string | null;
};

/** GET /admin/roles */
export type RolesResponseDto = {
  roles: Array<{
    value: AdminRole;
    label: string;
    description: string;
    permissions: Permission[];
  }>;
  /** Keyed by permission group: dashboard, vendors, menu, orders, ... */
  permissions: Record<string, Array<{ value: Permission; label: string }>>;
};

/** One role on the editable matrix. */
export type ManagedRoleDto = {
  value: AdminRole;
  label: string;
  description: string;
  /** What it holds right now — stored overrides included. */
  permissions: Permission[];
  /** The baseline it ships with, from the AdminRole enum. */
  default_permissions: Permission[];
  /** False for super_admin, which always holds everything. */
  is_editable: boolean;
  /** Whether it has been edited away from the baseline. */
  is_customised: boolean;
  /**
   * In the baseline but not held — the shape of "a module shipped and this
   * role never picked it up", which is what `sync-defaults` grants.
   */
  missing_from_default: Permission[];
};

/** GET /admin/roles/manage */
export type ManagedRolesResponseDto = {
  roles: ManagedRoleDto[];
  /**
   * Generated from the Permission enum, so a module shipped today appears on
   * the screen without a dashboard change.
   */
  permissions: Record<string, Array<{ value: Permission; label: string }>>;
};

/** POST /admin/roles/sync-defaults */
export type SyncDefaultsResponseDto = {
  /** role => permission values newly granted. */
  added: Record<string, Permission[]>;
  roles: ManagedRoleDto[];
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export type DashboardPeriodDto = {
  orders: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  commission: number;
  average_order_value: number;
};

/**
 * GET /admin/dashboard. The money blocks are omitted entirely for a role
 * without `payments.view` (i.e. support), hence the optional keys.
 */
export type DashboardDto = {
  vendors: {
    total: number;
    pending_review: number;
    approved: number;
    rejected: number;
    suspended: number;
    open_now: number;
  };
  riders: {
    total: number;
    pending_review: number;
    approved: number;
    suspended: number;
    /** Switched on and taking jobs right now. */
    online: number;
  };
  /** Every account, whatever its role — the only "how big is this" figure. */
  users: {
    total: number;
    active: number;
    suspended: number;
    new_this_week: number;
    by_role: { customers: number; vendors: number; riders: number; admins: number };
  };
  customers: { total: number; new_this_week: number; suspended: number };
  orders: {
    by_status: Record<OrderStatus, number>;
    abandoned_checkouts: number;
    awaiting_refund: number;
  };
  catalogue: {
    menu_items: number;
    menu_items_unavailable: number;
    categories: number;
    categories_active: number;
    banners_live: number;
    promo_codes_live: number;
  };
  reviews: {
    total: number;
    average_rating: number;
    hidden_by_moderation: number;
    awaiting_vendor_reply: number;
  };
  today?: DashboardPeriodDto;
  last_7_days?: DashboardPeriodDto;
  last_30_days?: DashboardPeriodDto;
  all_time?: DashboardPeriodDto;
  payments?: {
    collected_all_time: number;
    refunded_all_time: number;
    pending_attempts: number;
    gateway_success_rate: number;
  };
  promotions?: { redemptions: number; discount_given: number };
  top_vendors?: Array<{ vendor_id: number; name: string | null; orders: number; revenue: number }>;
  vendor_payouts_earned_all_time?: number;
};

/* -------------------------------------------------------------------------- */
/* Activity (audit log)                                                       */
/* -------------------------------------------------------------------------- */

/** AdminActivityResource */
export type ActivityDto = {
  id: number;
  action: string;
  description: string;
  admin: { id: number | null; email: string | null; role: string | null };
  subject: { type: string; id: number } | null;
  /** Secrets are already redacted to "[redacted]" server-side. */
  properties: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | null;
};

/* -------------------------------------------------------------------------- */
/* Users & customers                                                          */
/* -------------------------------------------------------------------------- */

/** AdminUserResource */
export type AdminUserDto = {
  id: number;
  email: string;
  phone: string;
  role: UserRole;
  admin_role: AdminRole | null;
  admin_role_label: string | null;
  status: UserStatus;
  is_active: boolean;
  phone_verified: boolean;
  display_name: string;
  profile:
    | { type: "customer"; id: number; first_name: string; last_name: string }
    | { type: "vendor"; id: number; business_name: string; status: VendorStatus }
    | null;
  last_login_at: string | null;
  created_at: string | null;
};

/** POST /admin/users and POST /admin/users/{id}/reset-password. */
export type StaffCredentialsDto = {
  user: AdminUserDto;
  /** Shown once and never retrievable again. */
  password: string;
};

/** AdminCustomerResource */
export type AdminCustomerDto = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture_url: string | null;
  referral_code: string | null;
  referral_count: number;
  account?: {
    id: number | null;
    email: string | null;
    phone: string | null;
    status: UserStatus | null;
    phone_verified: boolean;
    joined_at: string | null;
  };
  /** List responses only — `withCount` is not applied on show. */
  orders_count?: number;
  created_at: string | null;
};

export type CustomerSummaryDto = {
  orders_placed: number;
  orders_delivered: number;
  orders_cancelled: number;
  lifetime_value: number;
  /** Raw DB datetime, not ISO — parse defensively. */
  last_ordered_at: string | null;
};

/** GET /admin/customers/{id} */
export type CustomerDetailDto = {
  customer: AdminCustomerDto;
  summary: CustomerSummaryDto;
};

/* -------------------------------------------------------------------------- */
/* Vendors                                                                    */
/* -------------------------------------------------------------------------- */

/** VendorProfileResource */
export type VendorDto = {
  id: number;
  vendor_id: string;
  slug: string;
  business_name: string;
  contact_person_name: string;
  business_address: string;
  address: string | null;
  city: string;
  description: string | null;
  tax_identification_number: string | null;
  business_type_id: number;
  business_type?: { id: number; name: string };
  logo_url: string | null;
  cover_image_url: string | null;
  image_url: string | null;
  cuisine_types: string[] | null;
  categories: string[] | null;
  opening_time: string | null;
  closing_time: string | null;
  operating_days: string[] | null;
  estimated_prep_time_minutes: number | null;
  delivery_radius_km: number | null;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  min_order: number;
  promo_text: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  review_count: number;
  status: VendorStatus;
  status_label: string;
  rejection_reason: string | null;
  is_open: boolean;
  is_open_now: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_profile_complete: boolean;
  missing_profile_fields: string[];
  documents: {
    business_registration_certificate: { uploaded: boolean };
    food_safety_license: { uploaded: boolean };
    owner_id: { uploaded: boolean };
  };
  documents_status: string | null;
  documents_reviewed_at: string | null;
  payout: {
    bank_name: string | null;
    account_name: string | null;
    account_number_last4: string | null;
    branch_code_last4: string | null;
    mobile_money_number_last4: string | null;
    mobile_money_provider: MobileMoneyProvider | null;
    is_configured: boolean;
  };
  created_at: string | null;
  updated_at: string | null;
};

/** POST /admin/vendors */
export type VendorCredentialsDto = {
  vendor: VendorDto;
  password: string;
};

/** GET /admin/vendors/{id}/payout — full details, and every read is audit-logged. */
export type VendorPayoutDto = {
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  branch_code: string | null;
  mobile_money_provider: MobileMoneyProvider | null;
  mobile_money_number: string | null;
};

/** MenuItemResource */
export type MenuItemDto = {
  id: number;
  vendor_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number | null;
  category?: { id: number; name: string };
  is_available: boolean;
  is_popular: boolean;
  is_featured: boolean;
  minimum_order_qty: number;
  maximum_order_qty: number;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
};

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export type PaymentAttemptDto = {
  reference: string;
  provider: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  status_label: string;
  authorization_url: string | null;
  paid_at: string | null;
  created_at: string | null;
};

export type OrderItemDto = {
  id: number;
  menu_item_id: number | null;
  name: string;
  category_name: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  options?: Array<{ group_name: string; name: string; additional_price: number }>;
};

/** AdminOrderResource */
export type AdminOrderDto = {
  id: number;
  order_number: string;
  /** Food or parcel — both live on this board. */
  type: OrderType;
  type_label: string;
  is_parcel: boolean;
  status: OrderStatus;
  status_label: string;
  /** Drives the status dropdown so an illegal transition cannot be submitted. */
  allowed_transitions: Array<{ value: OrderStatus; label: string }>;
  /** Present only on a parcel. */
  parcel?: {
    size: ParcelSize;
    size_label: string;
    is_fragile: boolean;
    item_description: string;
    quantity: number;
    declared_value: number | null;
    pickup_address: string;
    pickup_contact_name: string | null;
    pickup_contact_phone: string | null;
    pickup_instructions: string | null;
    delivery_instructions: string | null;
    stop_count: number;
    /** The customer's own figure across the run. Nothing weighs the package. */
    total_weight_kg: number | null;
  };
  /** Every drop on the run. A one-stop parcel has one entry. */
  stops?: ParcelStopDto[];
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    is_paid: boolean;
    needs_refund: boolean;
    attempts?: PaymentAttemptDto[];
  };
  customer?: { id: number; name: string; email: string | null; phone: string | null };
  vendor?: { id: number; name: string; slug: string; phone: string | null };
  /**
   * The rider's user account, plus who they actually are once they have a
   * profile. Before the riders table existed this was an id and a phone.
   */
  rider?: {
    id: number;
    phone: string;
    rider_id: number | null;
    name: string | null;
    photo_url: string | null;
    vehicle_type: VehicleType | null;
    plate_number: string | null;
    /** Where they last reported in. Null when they have never opened the app. */
    latitude?: number | null;
    longitude?: number | null;
    location_updated_at?: string | null;
  } | null;
  /** Where the job starts: a kitchen for food, the sender for a parcel. */
  pickup?: {
    name: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  /** Where the job is in the broadcast, and who was asked. */
  dispatch: {
    assigned_at: string | null;
    arrived_at_pickup: string | null;
    picked_up_at: string | null;
    /** Set when every ring came back empty — this is the dispatch queue. */
    needs_manual_dispatch_at: string | null;
    offers?: DeliveryOfferDto[];
  };
  proof_of_delivery: {
    photo_url: string | null;
    delivered_to_name: string | null;
  };
  delivery: {
    recipient_name: string;
    recipient_phone: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  items?: OrderItemDto[];
  totals: {
    subtotal: number;
    delivery_fee: number;
    service_fee: number;
    discount: number;
    total: number;
    currency: string;
  };
  /**
   * The working behind the delivery fee, read from the settings version that
   * priced THIS order rather than the ones in force today.
   */
  pricing?: {
    distance_km: number;
    duration_minutes: number | null;
    base_fee: number;
    free_km: number;
    per_km: number;
    chargeable_km: number;
    distance_charge: number;
    vendor_percent: number;
    rider_percent: number;
    service_fee_percent: number;
    service_fee_flat: number;
    settings_name: string;
    /** False on orders placed before the rates were versioned. */
    settings_recorded: boolean;
  };
  /**
   * Where the money went. Recorded when the order was priced, never
   * re-derived — vendor + rider + platform = total.
   */
  earnings?: {
    vendor: number;
    rider: number;
    platform: number;
    service_fee: number;
    commission_setting_id: number | null;
  };
  notes: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  timeline: Array<{ status: OrderStatus; label: string; at: string | null }>;
  created_at: string | null;
  updated_at: string | null;
};

/** One job offered to one rider. */
export type DeliveryOfferDto = {
  id: number;
  order_id: number;
  order_number: string | null;
  status: DeliveryOfferStatus;
  status_label: string;
  round: number;
  earning: number;
  currency: string;
  distance_meters: number;
  eta_minutes: number | null;
  pickup: { name: string; address: string; latitude: number | null; longitude: number | null } | null;
  dropoff: { address: string | null; latitude: number | null; longitude: number | null };
  offered_at: string | null;
  expires_at: string | null;
  expires_in_seconds: number | null;
  responded_at: string | null;
};

/** GET /admin/orders/stats */
export type OrderStatsDto = {
  by_status: Record<OrderStatus, number>;
  awaiting_refund: number;
  gross_delivered: number;
};

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

/** AdminPaymentResource */
export type AdminPaymentDto = {
  id: number;
  reference: string;
  gateway_reference: string | null;
  provider: string;
  method: PaymentMethod | null;
  method_label: string | null;
  status: PaymentStatus;
  status_label: string;
  is_paid: boolean;
  amount: number;
  currency: string;
  order?: {
    id: number | null;
    order_number: string | null;
    status: OrderStatus | null;
    payment_status: PaymentStatus | null;
    total: number;
    vendor: { id: number; name: string } | null;
    customer: { id: number; name: string; phone: string | null } | null;
  };
  paid_at: string | null;
  created_at: string | null;
};

export type PaymentPeriodDto = {
  attempts: number;
  succeeded: number;
  failed: number;
  collected: number;
  refunded: number;
  net: number;
  success_rate: number;
};

/** GET /admin/payments/stats */
export type PaymentStatsDto = {
  today: PaymentPeriodDto;
  last_7_days: PaymentPeriodDto;
  last_30_days: PaymentPeriodDto;
  all_time: PaymentPeriodDto;
  by_status: Record<PaymentStatus, number>;
  /** Sparse — only methods that have been used appear. */
  by_method: Record<string, { attempts: number; collected: number }>;
  pending_attempts: number;
  stale_pending_attempts: number;
};

/* -------------------------------------------------------------------------- */
/* Promo codes & reference data                                               */
/* -------------------------------------------------------------------------- */

/** PromoCodeResource */
export type PromoCodeDto = {
  id: number;
  code: string;
  description: string | null;
  type: PromoCodeType;
  type_label: string;
  value: number;
  max_discount: number | null;
  min_order_amount: number;
  scope: PromoCodeScope;
  scope_label: string;
  vendor_id: number | null;
  category_id: number | null;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  max_per_customer: number | null;
  redemption_count: number;
  is_active: boolean;
  /** Active *and* inside its scheduling window. */
  is_live: boolean;
  created_at: string | null;
};

/** CategoryResource — read as reference data for vendor and promo forms. */
export type CategoryDto = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
};

/** BusinessTypeResource */
export type BusinessTypeDto = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
  /** Present on the admin list and show — adminQuery applies withCount. */
  vendors_count?: number;
};

/** BannerAdminResource — richer than the public BannerResource. */
export type BannerDto = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  placement: BannerPlacement;
  placement_label: string;
  display_order: number;
  link: { type: BannerLinkType; type_label: string; value: string | null };
  is_active: boolean;
  /** Active *and* inside its scheduling window — why a banner may not be showing. */
  is_live: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_by?: { id: number; email: string };
  created_at: string | null;
  updated_at: string | null;
};

/** ReviewResource */
export type ReviewDto = {
  id: number;
  rating: number;
  comment: string | null;
  /** Deliberately anonymised server-side to "First L." — never the full surname. */
  author?: { name: string; avatar_url: string | null };
  vendor?: { id: number | null; slug: string | null; name: string | null };
  order?: { id: number | null; order_number: string | null };
  reply: { body: string; replied_at: string | null } | null;
  is_visible: boolean;
  created_at: string | null;
};

/* ------------------------------------------------------------------ Riders */

/**
 * GET /admin/riders — the list row.
 *
 * Deliberately narrower than RiderDto: a listing is scanned, not read, so it
 * carries no identity number, home address or payout data across a page of a
 * hundred people just because the detail view is allowed to show one.
 */
export type RiderListDto = {
  id: number;
  /**
   * The user account behind the profile. This is the id assign-rider expects —
   * orders.rider_id points at users, not riders.
   */
  user_id: number;
  rider_code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  photo_url: string | null;
  city: string | null;
  vehicle_type: VehicleType | null;
  vehicle_type_label: string | null;
  plate_number: string | null;
  status: RiderStatus;
  status_label: string;
  is_active: boolean;
  is_online: boolean;
  is_profile_complete: boolean;
  /**
   * Absent until the rider has a wallet row — one is created on the first
   * credit, not at approval — so a rider with no wallet is a zero balance, not
   * an error.
   */
  wallet?: { balance: number; currency: string; lifetime_earned: number };
  documents_status: string | null;
  has_all_documents: boolean;
  rating: number;
  review_count: number;
  deliveries_completed: number;
  last_online_at: string | null;
  approved_at: string | null;
  created_at: string | null;
  deleted_at: string | null;
};

/** GET /admin/riders/{id} — the full owner/admin shape. */
export type RiderDto = {
  id: number;
  rider_code: string;
  first_name: string;
  last_name: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth: string | null;
  residential_address: string | null;
  city: string | null;
  profile_photo_url: string | null;
  identity: {
    type: IdentityDocumentType | null;
    type_label: string | null;
    number: string | null;
  };
  vehicle: {
    type: VehicleType | null;
    type_label: string | null;
    plate_number: string | null;
    make: string | null;
    model: string | null;
    colour: string | null;
    year: number | null;
    ownership: VehicleOwnership | null;
    ownership_label: string | null;
  };
  licence: {
    number: string | null;
    class: string | null;
    expires_at: string | null;
    permit_number: string | null;
    permit_expires_at: string | null;
  };
  insurance: {
    provider: string | null;
    policy_number: string | null;
    expires_at: string | null;
    roadworthy_expires_at: string | null;
  };
  /** Keyed by column, valued by the date. Expired is why a rider is grounded. */
  credentials: {
    expired: Record<string, string>;
    expiring_soon: Record<string, string>;
  };
  availability: {
    operating_areas: string[];
    operating_days: string[];
    shift_start_time: string | null;
    shift_end_time: string | null;
  };
  consent: {
    terms_accepted_at: string | null;
    terms_version: string | null;
    data_consent_at: string | null;
    is_complete: boolean;
    /** A rider on an older version has to agree again. */
    current_terms_version: string | null;
  };
  emergency_contact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
  status: RiderStatus;
  status_label: string;
  rejection_reason: string | null;
  is_active: boolean;
  is_profile_complete: boolean;
  missing_profile_fields: string[];
  approved_at: string | null;
  is_online: boolean;
  can_go_online: boolean;
  last_online_at: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  location_updated_at: string | null;
  max_delivery_radius_km: number;
  max_concurrent_jobs: number;
  rating: number;
  review_count: number;
  deliveries_completed: number;
  /** `required` varies with the vehicle — a bicycle needs no vehicle papers. */
  documents: Record<RiderDocumentType, { uploaded: boolean; required: boolean }>;
  documents_status: string | null;
  documents_reviewed_at: string | null;
  payout: {
    bank?: { id: number | null; name: string | null };
    payout_provider_id: number | null;
    account_name: string | null;
    account_number_last4: string | null;
    momo_provider?: { id: number | null; name: string | null };
    momo_provider_id: number | null;
    mobile_money_number_last4: string | null;
    is_configured: boolean;
  };
  created_at: string | null;
  updated_at: string | null;
};

/** POST /admin/riders — the password is returned exactly once. */
export type CreatedRiderDto = {
  rider: RiderDto;
  password: string;
};

/** GET /admin/riders/stats */
export type RiderStatsDto = {
  total: number;
  by_status: Record<RiderStatus, number>;
  online: number;
  incomplete: number;
  awaiting_review: number;
};

/** A bank or mobile-money network money can be sent to. */
export type PayoutProviderDto = {
  id: number;
  type: PayoutProviderType;
  name: string;
  short_name: string | null;
  slug: string;
  /** Paystack's bank code. Null until it is wired to the gateway. */
  code: string | null;
  logo_url: string | null;
  is_active: boolean;
  display_order: number;
  /** Admin listing only - what a delete would affect. */
  vendor_count?: number;
  rider_count?: number;
  created_at: string | null;
};

/** One line of a rider's statement. */
export type WalletTransactionDto = {
  /** Only on the platform-wide ledger, where both sides are mixed. */
  owner_type?: "rider" | "vendor";
  owner?: { id: number; name: string | null } | null;
  id: number;
  reference: string;
  type: WalletTransactionType;
  type_label: string;
  is_credit: boolean;
  /** Signed: negative when money went out. */
  amount: number;
  balance_after: number;
  currency: string;
  note: string | null;
  order?: { id: number; order_number: string } | null;
  withdrawal_id: number | null;
  created_at: string | null;
};

/** GET /rider/me/wallet and the summary half of the admin wallet endpoint. */
export type RiderWalletSummaryDto = {
  balance: number;
  currency: string;
  lifetime_earned: number;
  lifetime_withdrawn: number;
  /** Already reserved out of `balance`, but named so a rider can see it. */
  pending_withdrawal: number;
  minimum_withdrawal: number;
  can_withdraw: boolean;
  has_payout_details: boolean;
};

/** A payout request. The full account number is never returned. */
export type WithdrawalDto = {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  status_label: string;
  is_open: boolean;
  destination: {
    type: "bank" | "mobile_money";
    provider?: string | null;
    account_name: string | null;
    last4: string | null;
  };
  /** Riders and vendors share one payout queue. */
  owner_type: "rider" | "vendor" | null;
  owner?: { id: number; name: string; phone: string | null };
  requested_at: string | null;
  reviewed_at: string | null;
  reviewed_by?: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  rejection_reason: string | null;
};

/** GET /admin/withdrawals/stats */
export type WithdrawalStatsDto = {
  by_status: Record<WithdrawalStatus, { count: number; amount: number }>;
  awaiting_review: number;
  /** Everything currently sitting in rider wallets. */
  owed: number;
  paid_all_time: number;
};

/** GET /admin/riders/{id}/payout — every read is audit-logged. */
export type RiderPayoutDto = {
  payout_provider_id: number | null;
  bank_name: string | null;
  account_name: string | null;
  account_number_last4: string | null;
  momo_provider_id: number | null;
  momo_provider_name: string | null;
  mobile_money_number_last4: string | null;
  is_configured: boolean;
};

// --- Communications ---------------------------------------------------------

/** GET /admin/communications */
export type CommunicationDto = {
  id: number;
  uuid: string;
  channel: CommunicationChannel;
  channel_label: string;
  audience: CommunicationAudience;
  audience_label: string;
  audience_filters: CommunicationAudienceFilters | null;
  title: string;
  body: string;
  sms_body: string | null;
  data: Record<string, unknown> | null;
  image_url: string | null;
  status: CommunicationStatus;
  status_label: string;
  is_cancellable: boolean;
  is_editable: boolean;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  /** Whole-percent, computed server-side so three clients cannot round it three ways. */
  delivery_rate: number | null;
  author?: { id: number; email: string };
  created_at: string | null;
  updated_at: string | null;
};

export type CommunicationAudienceFilters = {
  vendor_status?: string | null;
  rider_status?: string | null;
  user_ids?: number[];
};

/** POST /admin/communications/preview — the blast radius, before spending it. */
export type AudiencePreviewDto = {
  recipients: number;
  /** Somebody who has never opened the app has no token and a push cannot reach them. */
  reachable_by_push: number;
  reachable_by_sms: number;
  audience_label: string;
};

/** One person's outcome, on one channel. The audit trail behind the counters. */
export type CommunicationRecipientDto = {
  id: number;
  channel: "push" | "sms";
  status: "pending" | "sent" | "failed" | "skipped";
  error: string | null;
  sent_at: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
};

/** GET /admin/communications/templates */
export type CommunicationTemplateDto = {
  id: number;
  name: string;
  channel: CommunicationChannel;
  channel_label: string;
  title: string;
  body: string;
  sms_body: string | null;
  placeholders: string[];
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

/** GET /admin/communications/options — the composer vocabulary, from the enums. */
export type CommunicationOptionsDto = {
  channels: Array<{ value: CommunicationChannel; label: string }>;
  audiences: Array<{ value: CommunicationAudience; label: string }>;
  statuses: Array<{ value: CommunicationStatus; label: string }>;
};

// --- Reports ----------------------------------------------------------------

/** GET /admin/reports */
export type ReportDto = {
  id: number;
  uuid: string;
  reporter_role: string;
  reporter: { id: number; name: string; phone: string | null; email: string | null } | null;
  target_type: ReportTargetType;
  target_type_label: string;
  target_id: number | null;
  target_name: string;
  target_phone: string | null;
  target_image_url: string | null;
  order_id: number | null;
  order_number: string | null;
  reason_code: string;
  reason_label: string;
  description: string;
  /** Short-lived signed URLs — complaint photos are evidence, not public art. */
  attachments: string[];
  status: ReportStatus;
  status_label: string;
  is_open: boolean;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string | null;
};

/** GET /admin/reports/stats */
export type ReportStatsDto = {
  total: number;
  by_status: Record<ReportStatus, number>;
  /** Pending and in-review together: both are still somebody's work. */
  open: number;
  awaiting_review: number;
  /** Filed in the last 24 hours, not since midnight. */
  today: number;
  by_target_type: Record<ReportTargetType, number>;
};

// --- Rider payout rules -----------------------------------------------------

/** One version of every money rule on the platform. */
export type PlatformSettingDto = {
  id: number | null;
  name: string;
  currency: string;

  delivery_base_fee: number | null;
  delivery_free_km: number | null;
  delivery_per_km: number | null;
  delivery_max_km: number | null;

  parcel_base_fee: number | null;
  parcel_per_km: number | null;
  parcel_pickup_per_km: number | null;
  parcel_per_stop_fee: number | null;
  parcel_fragile_surcharge: number | null;

  service_fee_percent: number | null;
  service_fee_flat: number | null;
  service_fee_cap: number | null;

  vendor_percent: number | null;
  rider_percent: number | null;
  parcel_rider_percent: number | null;

  rider_minimum: number | null;
  rider_minimum_withdrawal: number | null;
  vendor_minimum_withdrawal: number | null;

  is_active: boolean;
  /** False for the config-derived fallback, so a screen can say nothing is published. */
  is_published: boolean;
  effective_from: string | null;
  retired_at: string | null;
  orders_count: number | null;
  published_by: string | null;
  created_at: string | null;
};

/** GET /admin/platform-settings */
export type PlatformSettingsResponseDto = {
  /** Always present: published, or the config fallback. */
  current: PlatformSettingDto;
  history: PlatformSettingDto[];
};

/** POST /admin/platform-settings/preview — where every cedi goes. */
export type SettingsPreviewDto = {
  samples: Array<{
    label: string;
    distance_km: number;
    basket: number;
    delivery_fee: number;
    service_fee: number;
    customer_pays: number;
    vendor_earns: number;
    rider_earns: number;
    platform_earns: number;
  }>;
};

/** GET /admin/communications/audience/search — backs the "selected people" picker. */
export type AudienceCandidateDto = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  /** A push cannot reach somebody who has never opened the app. */
  has_device: boolean;
};

// --- Notifications ----------------------------------------------------------

/** GET /v1/notifications — the same feed every role reads, admins included. */
export type NotificationDto = {
  id: string;
  /** The payload's own type, not the FQCN — switch on this. */
  type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> & {
    /** Admin alerts carry a dashboard path to open. */
    href?: string;
    alert?: string;
    is_actionable?: boolean;
  };
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
};

/** One drop on a parcel run. */
export type ParcelStopDto = {
  id: number;
  /** Position on the itinerary, so a client can say "Stop 2 of 4". */
  sequence: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  instructions: string | null;
  item_description: string;
  size: ParcelSize | null;
  size_label: string | null;
  quantity: number;
  is_fragile: boolean;
  weight_kg: number | null;
  declared_value: number | null;
  /** "2 × Laptop in a padded sleeve (3.5 kg, fragile)" */
  summary: string;
  status: ParcelStopStatus;
  status_label: string;
  is_open: boolean;
  delivered_at: string | null;
  delivered_to_name: string | null;
  failure_reason: string | null;
  photos?: Array<{ id: number; url: string | null }>;
};

// --- Finance ----------------------------------------------------------------

/** GET /admin/finance/summary — the whole picture for a period. */
export type FinanceSummaryDto = {
  orders: number;
  /** What customers actually paid, on delivered orders only. */
  collected: number;
  vendor_earnings: number;
  rider_earnings: number;
  /**
   * What the platform kept — the remainder after paying both sides, so
   * vendor + rider + platform always equals collected.
   */
  platform_earnings: number;
  /** The named components of it. */
  commission_earned: number;
  service_fees: number;
  /**
   * Money kept that is neither commission nor a service fee — a delivery
   * nobody was paid for, or a promo the platform absorbed. A large figure
   * means orders settled without paying somebody.
   */
  unallocated: number;
  discounts: number;
  payouts: { paid: number; pending: number };
  /**
   * Still sitting in wallets — earned, not yet withdrawn. Neither the
   * platform's money nor spent, which is why it is its own figure.
   */
  owed: { riders: number; vendors: number };
  refunds_owed: { count: number; amount: number };
  currency: string;
  transaction_types: Array<{ value: string; label: string }>;
};

/** One party's balance, for a payout run. */
export type WalletBalanceDto = {
  id: number;
  owner_type: "rider" | "vendor";
  owner_id: number;
  owner_name: string | null;
  /** Whether they can actually be paid — the first thing a payout run needs. */
  has_payout_details: boolean;
  balance: number;
  lifetime_earned: number;
  lifetime_withdrawn: number;
  currency: string;
  updated_at: string | null;
};
