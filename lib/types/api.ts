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
  MobileMoneyProvider,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Permission,
  PromoCodeScope,
  PromoCodeType,
  UserRole,
  UserStatus,
  VendorStatus,
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
  status: OrderStatus;
  status_label: string;
  /** Drives the status dropdown so an illegal transition cannot be submitted. */
  allowed_transitions: Array<{ value: OrderStatus; label: string }>;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    is_paid: boolean;
    needs_refund: boolean;
    attempts?: PaymentAttemptDto[];
  };
  customer?: { id: number; name: string; email: string | null; phone: string | null };
  vendor?: { id: number; name: string; slug: string; phone: string | null };
  /** There is no rider name on this resource — only an id and a phone. */
  rider?: { id: number; phone: string } | null;
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
    discount: number;
    total: number;
    currency: string;
  };
  notes: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  timeline: Array<{ status: OrderStatus; label: string; at: string | null }>;
  created_at: string | null;
  updated_at: string | null;
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
