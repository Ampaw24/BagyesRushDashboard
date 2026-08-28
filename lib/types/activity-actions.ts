/**
 * The `action` strings the backend's audit log records.
 *
 * These live apart from `activity.service.ts` on purpose: the service reaches
 * for the API client, which reads cookies via `next/headers`. Anything a Client
 * Component might import has to stay free of that, or the whole chain gets
 * pulled into the browser bundle and the build fails.
 */
export const ACTIVITY_ACTIONS = [
  "vendor.created",
  "vendor.updated",
  "vendor.hours_updated",
  "vendor.toggled_open",
  "vendor.image_uploaded",
  "vendor.deleted",
  "vendor.restored",
  "vendor.payout_viewed",
  "vendor.approved",
  "vendor.rejected",
  "vendor.suspended",
  "rider.created",
  "rider.updated",
  "rider.photo_uploaded",
  "rider.deleted",
  "rider.restored",
  "rider.payout_viewed",
  "rider.approved",
  "rider.rejected",
  "rider.suspended",
  "rider.pending_review",
  "user.created",
  "user.updated",
  "user.role_changed",
  "user.suspended",
  "user.reinstated",
  "user.password_reset",
  "customer.suspended",
  "customer.reinstated",
  "order.rider_assigned",
  "order.refunded",
  "payment.verified",
  "menu_item.availability_toggled",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

/** Turns `vendor.payout_viewed` into "Vendor payout viewed". */
export function humaniseAction(action: string): string {
  const words = action.replace(/[._]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
