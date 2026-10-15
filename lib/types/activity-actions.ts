/**
 * The `action` strings the backend's audit log records.
 *
 * These live apart from `activity.service.ts` on purpose: the service reaches
 * for the API client, which reads cookies via `next/headers`. Anything a Client
 * Component might import has to stay free of that, or the whole chain gets
 * pulled into the browser bundle and the build fails.
 *
 * Grouped by module so the filter reads like the sidebar. Exports
 * (`export.<resource>`) and the backend's safety-net entries (`admin.<method>`,
 * written for an admin change no service described) are not listed — they are
 * found by searching rather than by picking.
 */
export const ACTIVITY_ACTIONS = [
  // Orders
  "order.status_changed",
  "order.rider_assigned",
  "order.refunded",
  "order.delivery_resolved",
  "payment.verified",

  // Conversations and support
  "conversation.replied",
  "conversation.closed",
  "conversation.reopened",
  "report.in_review",
  "report.resolved",
  "report.dismissed",

  // Money
  "wallet.credited",
  "wallet.debited",
  "withdrawal.approved",
  "withdrawal.rejected",
  "withdrawal.marked_paid",
  "withdrawal.verified",
  "platform_setting.published",

  // Vendors
  "vendor.created",
  "vendor.updated",
  "vendor.hours_updated",
  "vendor.toggled_open",
  "vendor.featured",
  "vendor.unfeatured",
  "vendor.image_uploaded",
  "vendor.deleted",
  "vendor.restored",
  "vendor.payout_viewed",
  "vendor.approved",
  "vendor.rejected",
  "vendor.suspended",
  "menu_item.availability_toggled",

  // Riders
  "rider.created",
  "rider.updated",
  "rider.photo_uploaded",
  "rider.availability_changed",
  "rider.deleted",
  "rider.restored",
  "rider.payout_viewed",
  "rider.approved",
  "rider.rejected",
  "rider.suspended",
  "rider.pending_review",
  "rider_agreement.created",
  "rider_agreement.updated",
  "rider_agreement.activated",
  "rider_agreement.deleted",

  // Customers
  "customer.suspended",
  "customer.reinstated",
  "review.hidden",
  "review.shown",
  "review.deleted",

  // Promotions and referrals
  "promo_code.created",
  "promo_code.updated",
  "promo_code.activated",
  "promo_code.deactivated",
  "promo_code.deleted",
  "referral.cancelled",
  "referral_milestone.created",
  "referral_milestone.updated",
  "referral_milestone.deleted",

  // Communications
  "communication.draft",
  "communication.scheduled",
  "communication.queued",
  "communication.cancelled",
  "communication_template.created",
  "communication_template.updated",
  "communication_template.deleted",

  // Catalogue
  ...catalogueActions("category"),
  ...catalogueActions("business_type"),
  ...catalogueActions("banner"),
  ...catalogueActions("payout_provider"),
  ...catalogueActions("vehicle_type"),
  ...catalogueActions("vehicle_make"),
  ...catalogueActions("vehicle_model"),

  // Staff and security
  "user.created",
  "user.updated",
  "user.role_changed",
  "user.suspended",
  "user.reinstated",
  "user.password_reset",
  "role.created",
  "role.updated",
  "role.deleted",
  "role.permissions_updated",
  "role.permissions_reset",
  "session.revoked",
  "compliance.retry",
] as const;

/** Every catalogue table records the same five writes. */
function catalogueActions<T extends string>(table: T) {
  return [
    `${table}.created`,
    `${table}.updated`,
    `${table}.activated`,
    `${table}.deactivated`,
    `${table}.deleted`,
  ] as const;
}

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

/** Turns `vendor.payout_viewed` into "Vendor payout viewed". */
export function humaniseAction(action: string): string {
  const words = action.replace(/[._]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
